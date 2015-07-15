sys.directive('enter', ["$parse", function($parse) {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply($parse(attrs["enter"]));
                event.preventDefault();
                event.currentTarget.blur();
            }
        });
    };
}])
    .directive('ctrlEnter', ["$parse", function($parse) {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13 && (event.metaKey || event.ctrlKey)) {
                scope.$apply($parse(attrs["ctrlEnter"]));
                event.preventDefault();
                event.currentTarget.blur();
            }
        });
    };
}])

.directive('tap', ["$parse", function($parse) {
    return function (scope, element, attrs) {
        element.bind("tap", function(event) {
            scope.$apply($parse(attrs["tap"]));
            event.preventDefault();
            event.currentTarget.blur();
        });
    };
}])

.directive('dblClick', [function() {
    return {
        restrict: "A",
        link: function (scope, element, attrs) {
            element.bind('dblClick', function(ev) { scope[attrs.dblClick](ev); });
        }
    };
}]);