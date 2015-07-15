angular.module('timelineModule').directive("card", ["timelineManager", function(timelineManager) {
    return {
        restrict: "E",
        require: "^project",
        templateUrl: "skins/timeline/components/workbox/card.html",
        replace: true,
        link: function(scope, element, attr, project) {
            element = $(element);
            var d = scope.data, origin = null;

            scope.text = "";

            scope.$watch("data.label", function() {
                scope.text = timelineManager.htmlify(scope.data.label);
            });

            scope.tagColour = project.tagColour;

            scope.$on("applyPosition", function(ev, ids) {
                origin = null;
                var offset = project.offset();
                var z = project.zoom();
                d.meta.x = element.position().left / z - offset.x;
                d.meta.y = element.position().top / z - offset.y;
            });

            element
                .singletap(function(ev) {
                    ev.stopPropagation();
                    var mode = project.getSelect();
                    if (mode == 4)
                        project.applySelectedTags(d);
                    else
                        scope.$emit(mode == 2 ? "itemMultiSelect" :"itemSelect", d);


                    $(document).trigger("mouseup");
                })
                .doubletap(function(ev) {
                    project.itemEdit(d);
                })
                .longpress(function(ev) {
                    ev.stopPropagation();
                    project.downTimeline(d.id);
                })
                .bind("tapstart", function(ev) {
                    ev.stopPropagation();
                })
                .draggable({
                    start: function(ev, ui) {
                        origin = element.position();
                        element.css({"z-index": 100});
                        ev.stopPropagation();
                    },
                    drag: function(ev, ui) {
                        d.index = -1;
                        setTimeout(function() { // delay so that position is applied... or something
                            if (origin)
                                project.repositionItem(scope.data, element.position().left - origin.left, element.position().top - origin.top);
                            origin = element.position();
                        }, 0);
                    },
                    stop: function(ev, ui) {
                        //var z = project.zoom();
                        //var offset = project.offset();
                        //d.meta.x = ui.position.left / z - offset.x;
                        //d.meta.y = ui.position.top / z - offset.y;
                        element.css({"z-index": 10});
                        origin = null;
                        project.applyPositions();
                    }
                });
        }
    }
}]);