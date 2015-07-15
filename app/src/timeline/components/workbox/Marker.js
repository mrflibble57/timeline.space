angular.module('timelineModule').directive("marker", ["shout", function(shout) {
    return {
        require: "^project",
        restrict: "E",
        templateUrl: "skins/timeline/components/workbox/marker.html",
        replace: true,
        link: function (scope, element, attr, project) {
            element = $(element);
            var d = scope.data;
            var o = d.sliplane ? {pos: "top", drag: "y"} : {pos: "left", drag: "x"};
            var box = $(element).find(".markerBox");
            box
                .doubletap(function(ev) {
                    project.editMarker(d);
                });
            element
                .addClass(d.sliplane?"sliplane":"waypoint")
                .bind("tapstart", function(ev) {
                    ev.stopPropagation();
                })
                .draggable({
                    axis: o.drag,
                    handle: ".markerBox",
                    start: function(ev) {
                        origin = element.position();
                        ev.stopPropagation();
                    },
                    drag: function(ev) {
                        setTimeout(function() { // delay so that position is applied... or something
                            project.repositionMarker(d, element.position().left - origin.left, element.position().top - origin.top);
                            origin = element.position();
                        }, 0);
                    },
                    stop: function(ev, ui) {
                        project.applyPositions();
                    }
                });


            var draw = function() {
                var css = {};
                var pp = project.offset()[d.sliplane?"y":"x"];
                css[o.pos] = (pp + d.offset) * attr.zoom;
                element
                    .css(css);
            };

            attr.$observe("zoom", draw);
            attr.$observe("offsetX", draw);
            attr.$observe("offsetY", draw);
            scope.$watch("data.offset", draw);

            scope.$on("markerDrag", function(ev, ids, x, y) {
                if(!ids || ids.indexOf(d.id) != -1) {
                    var pos = element.offset();
                    if (o.drag == "x")
                        element.offset({left: pos.left + x});
                    else
                        element.offset({top: pos.top + y});
                }
            });

            scope.$on("applyPosition", function() {
                var p = element.position();
                var offset = project.offset();
                d.offset = (o.drag == "x" ? p.left : p.top) / attr.zoom - offset[o.drag];
            });

        }
    }
}]);
