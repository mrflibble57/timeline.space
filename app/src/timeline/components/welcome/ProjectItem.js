angular.module('timelineModule').directive("projectItem", ["router", function(router) {
    return {
        restrict: "E",
        templateUrl: "skins/timeline/components/projectItem.html",
        replace: true,
        link: function (scope, element, attr) {
            scope.open = function() {
                router.goto("project/" + scope.project.id);
            };

            scope.rename = function() {
                scope.$emit("renameProject", scope.project);
            };

            scope.del = function() {
                scope.$emit("deleteProject", scope.project);
            };

            scope.share = function() {
                scope.$emit("shareProject", scope.project);
            }
        }
    }
}]);
