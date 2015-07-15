angular.module('timelineModule').directive("project", function() {
    return {
        restrict: "E",
        templateUrl: "skins/timeline/views/project.html",
        controller: "Project",
        replace: true,
        link: function($scope, e) {
            var w = $(window);
            e = $(e);
            var rs = function() {
                e.height(w.height());
                $scope.$broadcast("resize", e.width(), e.height());
            };
            w.resize(rs);
            rs();
            $scope.$watch("ready", function() { setTimeout(rs, 100); });
        }

    }
}).controller("Project", ["$scope", "$rootScope", "shout", "stacker", "popup", "router", "timelineManager", "language", "squirrel",
    function ($scope, $rootScope, shout, stacker, popup, router, timelineManager, language, squirrel) {
        language.bind($scope);

        var SELECT = 1, MULTI = 2, CHAIN = 3, TAG = 4;
        var wb, select, map, project, meta, selected = [];

        $scope.ready = false;
        $scope.$active = true;
        $scope.project = null;
        $scope.levels = "";
        $scope.cb = false;
        $scope.selected = false;
        $scope.selectedTag = null;
        $scope.select = SELECT;

        $scope.dragLabel = "";
        $scope.drag = 0;
        $scope.drags = [
            {id: 0, label: "Off"},
            {id: 1, label: "Items"},
            {id: 2, label: "All"}
        ];

        var top = $scope.top = false;

        var getProject = function() {
            shout.out("showWorking", "Loading Project");
            timelineManager.getProject($scope.$params.id, function (value) {
                shout.out("hideWorking");
                project = $scope.project = value;
                meta = project.meta;
                $scope.setDrag($scope.drag);
                selectMap();
                $scope.ready = true;
                apply();
            });
        };
        getProject();

        var selectMap = function() {
            $scope.levels = "";
            var levels = project.meta.levels.slice();  // copy array of ids for slicing
            top = $scope.top = levels.length == 0;
            map = $scope.map = top ? project : getMap(project.items, levels);
            setSelect($scope.select);
            z = map.meta.zoom;
            getSelectedItems();
        };

        var getMap = function(items, levels) {
            var found, item, key = levels.shift();
            for (var i in items) {
                item = items[i];
                if (item.id == key) {
                    found = true;
                    $scope.levels += " > " + (item.label.length > 0 ? item.label.substr(0, 30): item.id);
                    if (levels.length > 0)
                        item = getMap(item.items, levels);
                    break;
                }
            }
            if (!item.meta.offset)
                item.meta.offset = {x: 0, y: 0};
            return item;
        };

        var getSelectedItems = function() {
            selected = [];
            $.each(map.items, function(i, item) {   // remake the selected items list for this map
                if (item.meta.selected)
                    selected.push(item);
            });
            $scope.selected = selected.length > 0;
        };

        // traversing the timelines

        var downTimeline = this.downTimeline = function(value) {
            project.meta.levels.push(value);
            selectMap();
            apply();
        };

        $scope.upTimeline = function() {
            if (project.meta.levels.length > 0) {
                project.meta.levels.pop();
                selectMap();
                apply();
            }
        };

        var delayedSave = null;
        var change = function() {
            if (delayedSave)
                clearTimeout(delayedSave);
            delayedSave = setTimeout(function() { timelineManager.saveProject(project, function(result) {
                    if (result.error == "outOfDate")
                        shout.out("notify", "This project is not up to date.", "Warning", ["Overwrite", "Update"], function(index) {
                            if (index == 0)
                                timelineManager.saveProject(project, function() {}, true);
                            else
                                getProject();
                        });
                }, 1000);
            });

            //squirrel.store(project)
            /*if (!history[map.id])
                history[map.id] = {map: [], index: 0};
            var mh = history[map.id];
            mh.map = mh.map.slice(0, mh.index+1);
            var str = angular.toJson(map);
            mh.map.push(str);
            mh.index = mh.map.length-1;
            console.log("historify", map.id, mh.index)*/
        };
        $scope.$on("change", change);



        // header stuff

        var setSelect = $scope.setSelect = function(value) {
            if (top && [TAG, MULTI].indexOf(value) != -1)
                value = SELECT;
            $scope.select = select = value;
        };

        var setDrag = $scope.setDrag = function(value) {
            if (value > 2) value = 0;
            $scope.drag = value;
            $scope.dragLabel = $scope.drags[value].label;
            apply();
        };

        $scope.home = function() {
            router.goto("welcome");
        };


        var reIndex = function() {
            map.items.sort(function (a, b) { return a.meta.x - b.meta.x });
            $.each(map.items, function (i, item) { item.index = i + 1; })
        };

        // ITEM MOVING STUFF

        var findItemById = function(id, start) {
            start = start || 0;
            for (var index in map.items) {
                var ev = map.items[index];
                if (ev.id == id) {
                    return ev;
                }
            }
        };

        var findChildren = function(earliestIndex, matchId, list) {
            $.each(map.chains, function(i, chain) {
                var bw = chain.bw;
                if (bw.indexOf(matchId) > -1) {
                    var linkId = bw[1 - bw.indexOf(matchId)]; // get linked-to id
                    var linkEv = findItemById(linkId);
                    if (linkEv.index > earliestIndex && list.indexOf(linkId) == -1) {
                        list.push(linkId);
                        findChildren(earliestIndex, linkId, list);
                    }
                }
            })
        };

        var findMarkers = function(axis, offset) {
            drag.markers = [];
            $.each(map.markers, function(i, marker) {
                if (((axis == "y" && marker.sliplane) || (axis == "x" && !marker.sliplane)) && offset < marker.offset) {
                    drag.markers.push(marker.id);
                }
            });
        };

        var moveItems = function(item, x, y) {
            if (!drag.cards) {
                drag.cards = [];
                $.each(drag.ids, function(i, id) {
                    if (id != item.id)
                        drag.cards.push($("#card" + id));
                });
            }
            $.each(drag.cards, function(i, el) {
                var pos = el.offset();
                el.offset({left: pos.left + x, top: pos.top + y});
            });
            $scope.$broadcast("repositionChain", drag.ids);
        };

        var drag = {};


        $scope.$on("addMarker", function(ev, tapEvent, touch, sliplane) {
            var pos = getTapPosition(tapEvent, touch);
            var os = map.meta.offset[sliplane ? "y" : "x"];
            var m = {
                id: map.markers.length > 0 ? map.markers[map.markers.length-1].id+1 : 1,
                label: null,
                sliplane: sliplane,
                offset: (pos.x + 20) / z - os
            };
            map.markers.push(m);
            apply();
            change();
        });

        this.removeMarker = function(wp) {
            var wps = [];
            $.each(map.markers, function(i, match) {
                if (match.id != wp.id)
                    wps.push(match);
            });
            map.markers = wps;
            apply();
            change();
        };

        this.repositionMarker = function(marker, x, y) {
            if ($scope.drag > 0) {  // if dragging items
                var offset;
                var index;
                if (!drag.ids) {
                    drag.ids = [];
                    for (index in map.items) {
                        var e = map.items[index];
                        if (e.meta[marker.sliplane ? "y" : "x"] > marker.offset) {
                            drag.ids.push(e.id);
                        }
                    }
                }
                moveItems({}, x, y);
                if ($scope.drag > 1) {  // if dragging markers too
                    if (!drag.markers) {
                        findMarkers(marker.sliplane?"y":"x", marker.offset);
                    }
                    $scope.$broadcast("markerDrag", drag.markers, x, y);
                }
            }
        };




        // ITEM EDITING

        var itemDelete = function (value) {
            if (value.constructor !== Array)
                value = [value];

            while (value.length > 0) {
                var item = value.pop();
                var id = item.id;
                var index, chains = [], items = [];
                for (index in map.chains) {
                    var c = map.chains[index];
                    if (c.bw.indexOf(id) == -1)
                        chains.push(c);
                }
                for (index in map.items) {
                    var e = map.items[index];
                    if (e.id != id)
                        items.push(e);
                }
                map.items = items;
                map.chains = chains;
            }
            deselectItems();
            reIndex();
            change();
            if (stacker.active())
                stacker.pop();
        };



        var itemEdit = this.itemEdit = function(data) {
            var update = function(value) {
                for (var i in value) {
                    if (i.indexOf("$") != 0)
                        data[i] = value[i];
                }
                change();
                stacker.pop();
            };
            stacker.push({
                scope: $scope,
                templateUrl: "skins/timeline/popups/item.html",
                controller: "Item",
                width: 450,
                language: true,
                apply: {
                    item: fresh(data),
                    complete: function(value) {
                        update(value);
                        stacker.pop();
                        change();
                    },
                    remove: itemDelete,
                    drill: function(value) {
                        update(value);
                        stacker.pop();
                        change();
                        downTimeline(value.id);
                    },
                    reposition: stacker.reposition
                },
                pass: {
                    upload: timelineManager.addImage
                }
            });
        };

        var deleteChain = function(chain) {
            map.chains.splice(map.chains.indexOf(chain), 1);
            change();
            apply();
        };

        $scope.$on("chainAlt", function(ev, chain) { deleteChain(chain); });

        var selectMultiItem = function(item) {
            item.meta.selected = !item.meta.selected;
            if (item.meta.selected)
                selected.push(item);
            else
                selected.splice(selected.indexOf(item), 1);
            $scope.selected = selected.length > 0;
            apply();
        };

        $scope.$on("itemMultiSelect", function(ev, data) { selectMultiItem(data); });

        var selectItem = function(item, sys) {
            if (selected.length == 0 || sys) {
                item.meta.selected = true;
                selected.push(item);
            }
            else if (selected.length > 1) {
                deselectItems();
                selectItem(item);
            }
            else if (selected.length == 1) {
                if (item.meta.selected)
                    deselectItems();
                else if (select == CHAIN) {
                    /*var st = [];
                    for (index in meta.tags) {
                        var t = meta.tags[index];
                        if (t.selected)
                            st.push({label: t.label, colour: t.colour})
                    }*/
                    var chain = {bw: [selected[0].id, item.id], tags: []};
                    var found = false;
                    for (index in map.chains) {
                        var c = map.chains[index];
                        if ((c.bw[0] == chain.bw[0] && c.bw[1] == chain.bw[1]) || (c.bw[1] == chain.bw[0] && c.bw[0] == chain.bw[1])) {
                            found = true;
                            c.tags = chain.tags;
                            break;
                        }
                    }
                    if (!found) {
                        map.chains.push(chain);
                    }
                    deselectItems(true);
                    selectItem(item, true);
                    change();
                }
                else {
                    deselectItems(true);
                    selectItem(item, true);
                }
            }
            $scope.selected = selected.length > 0;
            apply();
        };

        $scope.$on("itemSelect", function(ev, data) { selectItem(data); });


        var deselectItems = function() {
            $.each(map.items, function(i, item) {
                item.meta.selected = false;});
            selected = [];
            $scope.selected = false;
            apply();
        };

        var calcChainMiddle = function(f, t) {
            return f + ((t - f) / 2);
        };


        var copyObject = null;
        $scope.copy = function(cut) {
            if (selected.length == 0)
                return;
            copyObject = {items:[], chains:[]};
            var newItems = fresh(selected);
            var oldIds = [];
            var newIds = [];
            $.each(newItems, function(i, item) {
                oldIds.push(item.id);
                var newId = uid();
                item.id = newId;
                newIds.push(newId);
                item.meta.x -= map.meta.offset.x;
                item.meta.y -= map.meta.offset.y;
                copyObject.items.push(item);
            });
            if (oldIds.length > 1)
                $.each(map.chains, function(i, chain) {
                    if (oldIds.indexOf(chain.bw[0]) != -1 && oldIds.indexOf(chain.bw[1]) != -1) {
                        copyObject.chains.push({bw: [newIds[oldIds.indexOf(chain.bw[0])], newIds[oldIds.indexOf(chain.bw[1])]], tags: chain.tags.splice()});
                    }
                });
            if (cut)
                itemDelete(selected);
            $scope.cb = true;
        };

        $scope.paste = function() {
            if (copyObject) {
                deselectItems();
                $.each(copyObject.items, function(i, item) {
                    item.meta.x += 40;
                    item.meta.y += 40;
                    item.index = -1;
                    map.items.push(item);
                    selected.push(item);
                });
                $.each(copyObject.chains, function(i, chain) {
                    map.chains.push(chain);
                });
                $scope.cb = false;
                copyObject = null;
                reIndex();
                getSelectedItems();
                change();
            }
        };

        $scope.deleteSelected = function() {
            itemDelete(selected);
        };

        $scope.$on("chainTap", function(ev, data) {
            if (select == TAG) {
                applySelectedTags(data);
                return;
            }
            var e1 = findItemById(data.bw[0]);
            var e2 = findItemById(data.bw[1]);
            var item = addItem(calcChainMiddle(e1.meta.x, e2.meta.x), calcChainMiddle(e1.meta.y, e2.meta.y), true);
            var chain = {bw: [data.bw[1], item.id], tags: data.tags};
            data.bw[1] = item.id;
            map.chains.push(chain);
            apply();
            $scope.$broadcast("repositionChain");
            change();
        });

        $scope.manageTags = function() {
            if (!project.meta.tags)
                project.meta.tags = [];

            stacker.push({
                scope: $scope,
                templateUrl: "skins/timeline/popups/manageTags.html",
                controller: "TagManager",
                width: 400,
                language: true,
                apply: {
                    tags: fresh(project.meta.tags),
                    save: function(tags) {
                        project.meta.tags = tags;

                        var validTagIds = [];
                        $.each(meta.tags, function(i, itemTag) {
                            validTagIds.push(itemTag.id);
                        });

                        var validateTagIds = function(itemTags) {
                            var arr = [];
                            $.each(itemTags, function(i, itemTag) {
                                if (validTagIds.indexOf(itemTag) != -1)
                                    arr.push(itemTag);
                            });
                            return arr;
                        };

                        var fn = function(m) {
                            $.each(m.items, function(i, item) {
                                if (!item.tags)
                                    item.tags = [];
                                item.tags = validateTagIds(item.tags);
                                if (item.items)
                                    fn(item);
                            });
                            if (m.chains)
                                $.each(m.chains, function(i, c) {
                                    c.tags = validateTagIds(c.tags);
                                });
                        };
                        fn(project);


                        stacker.pop();
                    }
                },
                pass: {
                    reposition: stacker.reposition,
                    uid: uid
                }
            });
        };

        $scope.selectTags = function() {
            stacker.push({
                scope: $scope,
                templateUrl: "skins/timeline/popups/selectTags.html",
                controller: "TagSelector",
                width: 200,
                language: true,
                apply: {
                    tags: project.meta.tags,
                    select: function(tag) {
                        $scope.selectedTag = tag;
                        stacker.pop();
                    }
                }
            });
        };

        $scope.$on("resize", function(ev, w, h) {
            wb.width(w).height(h - 80);
        });


        var uid = function() {
            meta.uid++;
            return meta.uid;
        };

        var fresh = function(value) {
            return angular.fromJson(angular.toJson(value));
        };

        var addItem = function(x, y, editItem) {
            if (!$scope.$active)
                return;
            var item = {
                id: uid(),
                label: "",
                src: "",
                index: -1,
                tags: [],
                items: [],
                markers: [],
                chains: [],
                meta: {x: x, y: y, offset: {x: 0, y: 0}, zoom: 1, active: true}
            };

            map.items.push(item);

            reIndex();
            apply();
            if (editItem)
                itemEdit(item);
            return item;
        };

        var z = 1;
        var zoomTo = $scope.zoomTo = function(c, x, y) {
            z = map.meta.zoom;
            if (!x) {
                x = wb.width() / 2 / z;
                y = wb.height() / 2 / z;

            }
            var newZoom = z + (z * 0.1 * c);
            map.meta.zoom = newZoom;
            var np = {x: x * z / newZoom , y: y * z / newZoom}; // get new position
            z = newZoom;
            map.meta.offset.x += np.x - x;
            map.meta.offset.y += np.y - y;
            apply();
            $scope.$broadcast("repositionChain");
        };

        var getTapPosition = function(ev, touch) {
            if (touch[0])
                touch = touch[0];
            if (touch.offset && touch.offset.x)
                return touch.offset;
            var e = ev.originalEvent;
            var t = ev.currentTarget;
            return {x: e.clientX - t.offsetLeft, y: e.clientY - t.offsetTop};
        };

        $scope.help = function() {
            stacker.push({
                width: 680,
                language: true,
                templateUrl: "skins/timeline/popups/help.html"
            });
        };

        $scope.export = function() {
            shout.out("showWorking", "Exporting to Google Docs");
            timelineManager.exportProject(project, {}, function(file) {
                shout.out("hideWorking");
                shout.out("notify", "Your project has been exported into Google Docs. Would you like to view it now?", "Export Complete", ["Yes", "No"], function(index) {
                    if (index == 0)
                        window.open(file.alternateLink, "_blank");
                });
            });
        };

        wb = $("#workbox");
        wb
            .tap(function(ev, touch) {
                if (!$scope.$active) {
                    $scope.$active = true;
                    return;
                }
                var pos = getTapPosition(ev, touch);
                pos.x = pos.x / z - 125 - map.meta.offset.x;
                pos.y = pos.y / z - 50 - map.meta.offset.y;
                var item = addItem(pos.x, pos.y, true);
                if (selected.length == 1)
                    selectItem(item);
                else
                    change();
            })
            .tapstart(function(ev, touch) {
                var offsetPosition = touch.position;
                $(document)
                    .bind("tapmove.wb", function(ev, touch) {
                        var touchPosition = touch.position;
                        var pos = {x: (touchPosition.x - offsetPosition.x) / z,  y: (touchPosition.y - offsetPosition.y) / z};
                        map.meta.offset.x += pos.x;
                        map.meta.offset.y += pos.y;

                        $(".chain").each(function(index, obj) {
                            obj = $(obj);
                            var os = obj.offset();
                            obj.offset({"top": os.top + (pos.y * z), "left": os.left + (pos.x * z)});
                        });
                        apply();

                        offsetPosition = touchPosition;
                    })
                    .bind("tapend.move", function(ev) {
                        $(document).unbind("tapmove.wb");
                        $(document).unbind("tapend.wb");
                    });
            })
            .longpress(function(ev) {
                ev.stopPropagation();
                if (!top)
                    $scope.upTimeline();
            })
            .on("dragover dragenter", function (e) {
                e.stopPropagation();
                e.preventDefault();
            })
            .on("drop", function (ev) {
                ev.preventDefault();
                var e = ev.originalEvent;
                if (e.type == "mouseup")    // regular div dnd have this signature, files are "drop"
                    return;
                var file = e.dataTransfer.files[0];
                var pos =  {x: e.clientX - ev.target.offsetLeft, y: e.clientY - ev.target.offsetTop};
                pos.x = (pos.x - map.meta.offset.x) / z - 125;
                pos.y = (pos.y - map.meta.offset.y) / z - 50;
                var item = addItem(pos.x, pos.y, false);
                shout.out("showWorking", "Uploading image");
                timelineManager.addImage(file, function(value) {
                    item.src = value;
                    shout.out("hideWorking");
                    itemEdit(item);
                    apply();
                    change();
                })
            });




        $(document)
            .keydown(function(ev) {
                if ($scope.ready) {
                    var ctrl = ev.metaKey || ev.ctrlKey;
                    var sh = ev.shiftKey;
                    var match = false;
                    var isa = function(arr) {
                        match = arr.indexOf(ev.which) != -1;
                        return match;
                    };
                    if (!stacker.active() && $scope.$active) {

                        if (isa([8,46])) {
                            itemDelete(selected);
                            ev.preventDefault();
                        }
                        else if (isa([16]))
                            setDrag(2);
                        else if (isa([17, 91, 224]))
                            setDrag(1);
                        else if (isa([27])) {   // escape
                            deselectItems();
                            change();
                        }
                        else if (select == TAG) {
                            if (isa([49,50,51,52,53,54,55,56,57])) {       // numbers 1- 9
                                var i = ev.which - 49;
                                if (i < meta.tags.length)
                                    $scope.selectedTag = meta.tags[i];
                            }
                            else if (isa([48])) {
                                $scope.selectedTag = null;
                            }
                        }
                    }

                    //else if (isa([18]))   // alt key
                    if (match)
                        apply();
                }
            })
            .keyup(function(ev) {
                if (!stacker.active() && $scope.ready) {
                    var match;
                    var isa = function(arr) {
                        match = arr.indexOf(ev.which) != -1;
                        return match;
                    };
                    if (isa([16, 17, 91, 224]))
                        setDrag(0);
                    if (match)
                        $scope.$apply();
                }
            })
            .bind("mousewheel DOMMouseScroll", function(e) {
                if ($scope.ready && $scope.$active) {
                    e = e.originalEvent;
                    var cp = wb.position();
                    var op = {x: (e.clientX - cp.left) / z, y: (e.clientY - cp.top) / z};
                    var c = (e.wheelDelta > 0 || e.detail < 0 ? 1 : -1);
                    zoomTo(c, op.x, op.y);
                }
            });

        var apply = function() {
            if (!$scope.$$phase)
                $scope.$apply();
        };

        $scope.$on("$destroy", function() {
            $(window).unbind("keypress");
            stacker.clear();
            popup.close();
        });

        $rootScope.$on("active", function(ev, value) { $scope.$active = value; });  // from stacker

        // for "require" access by cards, chains and markers

        this.getSelect = function() { return select; };
        this.applySelectedTags = function(item) {
            var tags = [];
            if (!$scope.selectedTag && item.tags.length > 0)
                tags = [];
            else {
                var found = false, id = $scope.selectedTag ? $scope.selectedTag.id : null;
                $.each(item.tags, function (i, tag) {
                    if (tag != id)
                        tags.push(tag);
                    else
                        found = true;
                });
                if (!found && id != null)
                    tags.push(id);

            }
            item.tags = tags;
            $scope.$apply();
            change();
        };
        this.tagColour = function(id) {
            for (var i in meta.tags) {
                var t = meta.tags[i];
                    if (t.id == id)
                        return t.colour;
            }
        };
        this.repositionItem = function(item, x, y) {
            if (!drag.ids) {
                drag.ids = [];
                if (selected.length > 1 && selected.indexOf(item) != -1) {
                    $.each(selected, function (i, sel) {
                        drag.ids.push(sel.id);
                        sel.index = -1;
                    });
                }
                else
                    drag.ids.push(item.id);
                if ($scope.drag > 0) {
                    reIndex();
                    if (!top)
                        $.each(drag.ids, function (i, id) {
                            findChildren(findItemById(id).index, id, drag.ids);
                        });
                }
            }
            moveItems(item, x, y);
            if ($scope.drag > 1) {
                if (!drag.markers)
                    findMarkers(item.meta.x, item.meta.y);
                $scope.$broadcast("markerDrag", drag.markers, x, y);
            }
        };
        this.applyPositions = function() {
            drag = {};
            $scope.$broadcast("applyPosition");
            reIndex();
            change();
        };
        this.editMarker = function(marker) {
            stacker.push({
                scope: $scope,
                templateUrl: "skins/timeline/popups/marker.html",
                width: 280,
                language: true,
                apply: {
                    marker: fresh(marker),
                    complete: function(value) {
                        marker.label = value.label;
                        stacker.pop();
                        change();
                    },
                    remove: function() {
                        var markers = [];
                        $.each(map.markers, function(i, match) {
                            if (match.id != marker.id)
                                markers.push(match);
                        });
                        map.markers = markers;
                        stacker.pop();
                        apply();
                        change();
                    }
                }
            })
        };
        this.zoom = function() { return z; };
        this.offset = function() { return map.meta.offset };
}]);