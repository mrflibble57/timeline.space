'use strict';
var TimelineDirectiveDropDown = function($parse) {
    return {
        restrict: "E",
        scope : {
            label: "@",
            img: "@"
        },
        require: "ngModel",
        transclude: true,
        templateUrl: "skins/timeline/components/dropdown.html",
        link: function(scope, e, a, ngModel) {
            var source = JSON.parse(a.source);
            var selectedIndex = -1;
            ngModel.$render = function() {
                for (selectedIndex in source) {
                    var s = source[selectedIndex];
                    if (s.id == ngModel.$modelValue) {
                        scope.selected = s;
                        break;
                    }
                }
            };
            $(e).click(function(ev) {
                var mode = a.mode;
                if (mode == "popup") {

                }
                else if (mode == "cycle") {
                    selectedIndex++;
                    if (selectedIndex >= source.length)
                        selectedIndex = 0;
                    scope.selected = source[selectedIndex];
                    ngModel.$setViewValue(scope.selected.id);
                    console.log(a)
                }
            })
        },
        replace: true
    };
};