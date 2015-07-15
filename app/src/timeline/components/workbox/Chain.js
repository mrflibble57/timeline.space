angular.module('timelineModule').directive("chain", [function() {
    return {
        restrict: "E",
        require: "^project",
        templateUrl: "skins/timeline/components/workbox/chain.html",
        replace: true,
        link: function (scope, element, attr, project) {
            element = $(element);

            var linkedTo = [0,0], bw1, bw2, d = scope.data;
            var pos = function (d) {
                var o = d.position();
                return {
                    x: o.left + (d.width() / 2 * attr.zoom),
                    y: o.top + (d.height() / 2 * attr.zoom)
                };
            };
            var getLinked = function() {
                bw1 = $("#card" + scope.data.bw[0]);
                bw2 = $("#card" + scope.data.bw[1]);
            };

            scope.tagColour = project.tagColour;

            element
                .bind("tapstart", function(ev) {
                    ev.stopPropagation();
                })
                .tap(function(ev, touch) {
                    if (project.getSelect() == 4)
                        project.applySelectedTags(d);
                    else
                        scope.$emit("chainTap", scope.data, touch[0]);
                    ev.stopPropagation();
                })
                .longpress(function(ev, touch) {
                    ev.stopPropagation();
                    scope.$emit("chainAlt", scope.data);
                });

            var draw = function() {
                if (d.bw[0]!=linkedTo[0] || b.bw[1]!= linkedTo[1])
                    getLinked();
                scope.linkHeight = (20 * attr.zoom) + "px";
                var thickness = 20 * attr.zoom * scope.data.tags.length;
                var f = pos(bw1), t = pos(bw2);
                var length = Math.sqrt(((t.x - f.x) * (t.x - f.x)) + ((t.y - f.y) * (t.y - f.y)));
                var angle = Math.atan2((f.y - t.y), (f.x - t.x)) * (180 / Math.PI);
                var cx = ((f.x + t.x) / 2) - (length / 2);
                var cy = ((f.y + t.y) / 2) - (thickness / 2);
                var a = "rotate(" + angle + "deg)";
                element.css({
                    "top": cy,
                    "left": cx,
                    "width": length,
                    "min-height": scope.linkHeight,
                    "-moz-transform": a,
                    "-o-transform": a,
                    "-webkit-transform": a,
                    "-ms-transform": a,
                    "transform": a
                });
            };

            attr.$observe('zoom', draw);
            scope.$on("repositionChain", function (ev, ids) {
                if (!ids || ids.indexOf(d.bw[0]) !=-1 || ids.indexOf(d.bw[1]) !=-1)
                    draw();
            });

            setTimeout(draw, 0);

        }
    }
}]);