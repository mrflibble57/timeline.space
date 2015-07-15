'use strict';

var SysDirectiveTree = function($compile) {
    return {
        restrict: "E",
        replace: true,
        link: function (scope, element, attrs) {
            var source = attrs.source;
            var nodeLabel = attrs.labelField || 'label';
            var children = attrs.childrenField || 'children';

            var drillRef = 0;
            var selectRef = 0;

            var llArray = [];
            var selectArray = [];

            var build = function(items) {
                var str = "";
                for (var item in items) {
                    var i = items[item];
                    selectArray[selectRef] = i;

                    var className = ["selector", i[children]?"tree":"node"];
                    if (i.selected)
                        className.push("selected");
                    str += '<li class="closed" ng-click="select($event)" data-ref="' + selectRef + '"><div class="' + className.join(" ") + '"><div' + (i[children]?' ng-click="toggle($event)"':'') + '></div><div>' + i[nodeLabel] + '</div></div>';
                    if (i[children]) {
                        llArray[drillRef] = i[children];
                        str +='<ul class="unloaded" data-ref="' + drillRef + '"></ul>';
                        drillRef++;
                    }
                    selectRef++;
                    str += "</li>";
                }
                return str;
            };

            var template = "<ul>" + build(scope[source]) + "</ul>";
            element.html('').append($compile(template)(scope));

            var toggling = false;
            scope.toggle = function(event) {
                toggling = true;
                var li = $(event.currentTarget.parentElement.parentElement);
                var ul = li.find("ul:first");
                if (ul.hasClass("unloaded")) {
                    var ref = ul.attr("data-ref");
                    var template = build(llArray[ref]);
                    ul.append($compile(template)(scope));
                    ul.removeClass();
                }
                var nc = li.hasClass("open") ? "closed" : "open";
                li.removeClass().addClass(nc);
            };

            scope.select = function(event) {
                event.stopPropagation();
                if (!toggling) {
                    var target = $(event.currentTarget);
                    var treeItem = selectArray[target.attr("data-ref")];
                    var div = target.find("div:first");
                    if (div.hasClass("selected")) {
                        div.removeClass("selected");
                        delete treeItem.selected;
                    } else {
                        div.addClass("selected");
                        // remove all selected children and parents.
                        target.parents("li").each(function() {
                            var item = $(this);
                            delete selectArray[item.attr("data-ref")].selected;
                            item.find("div:first").removeClass("selected");
                        });
                        target.find("li").each(function() {
                            $(this).find("div:first").removeClass("selected");
                        });
                        if (treeItem[children])
                            deselect(treeItem[children]);
                        treeItem.selected = true;
                    }
                    var ref = target.attr("data-ref");
                }
                toggling = false;
            };

            var deselect = function(items) {
                for (var i in items) {
                    var item = items[i];
                        delete item.selected;
                    if (item[children])
                        deselect(item[children]);
                }
            };

            scope.clear = function() {
                $(element).find("div.selected").removeClass("selected");
                console.log("TREE DESELECT Scope:",scope," Source:",source);
                deselect(scope[source]);
            };

        }
    };
};