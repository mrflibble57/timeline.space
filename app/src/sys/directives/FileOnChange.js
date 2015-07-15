sys.directive("fileChange", [function() {
    return {
        restrict: "A",
        link: function (scope, element, attrs) {
            element.bind('change', function(ev) {scope[attrs.fileChange](element[0].files[0])});
        }
    };
}])
    .directive("load", ["$parse", function($parse) {
    return {
        restrict: "A",
        link: function (scope, element, attrs) {
            setTimeout(function() {scope.$apply($parse(attrs["load"])); }, 0);
        }
    };
}])
    .directive("focus", [function() {
    return {
        restrict: "A",
        link: function (scope, element, attrs) {
            setTimeout(function(){$(element).focus().select();}, 100);
        }
    };
}]);