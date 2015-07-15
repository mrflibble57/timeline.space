sys.directive("modalHeader", ["language", function() {
    return {
        restrict: "E",
        templateUrl: "skins/sys/modalHeader.html",
        replace: true,
        transclude: true
    };
}]);