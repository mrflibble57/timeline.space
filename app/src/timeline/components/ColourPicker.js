angular.module('timelineModule').directive("colourPicker", ["popup", function(popup) {

    return {
        scope: {
            colour: "="
        },
        restrict: "E",
        template: '<div class="tinyTag" ng-style="{\'background-color\': colour}"></div>',
        replace: true,
        link: function (scope, element, attr) {
            element = $(element);
            element
                .bind("tap", function() {
                    popup.open({
                        templateUrl: "skins/timeline/popups/colourPicker.html",
                        relative: this,
                        lockCorners: false,
                        apply: {
                            colours: ["#ff5400", "#ff0000", "#ff00a8", "#ff7fd3", "#b85dff", "#5388ff", "#53b8ff", "#53ffc4", "#67ff53", "#f9ff48"],
                            select: function(value) {
                                scope.colour = value;
                                popup.close();
                            }
                        }
                    });

            })
        }
    }
}]).directive("colourBox", [function() {
    return {
        restrict: "E",
        template: '<div class="colourBox" ng-style="{\'background-color\': colour}"></div>',
        replace: true
    }
}]);
