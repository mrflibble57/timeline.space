angular.module('timelineModule').directive("border", [function() {
    return {
        restrict: "E",
        templateUrl: "skins/timeline/components/workbox/border.html",
        replace: true,
        link: function (scope, element, attr) {
            element = $(element);
            var sliplane = attr.position == "left";
            if (sliplane) {
                element.css({"top": "100px", "transform": "rotate(90deg)"});
            }
            else {
                element.css({"top": "80px"});
            }
            element.bind("tap", function(ev, touch) {
                scope.$emit("addMarker", ev, touch, sliplane);
            });

            scope.$on("resize", function(ev, w, h) {
                if (sliplane)
                    element.width(h - 100);
                else
                    element.width(w - 20);
            });
        }
    }
}]);
