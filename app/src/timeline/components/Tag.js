angular.module('timelineModule').directive("tag", [function() {
    return {
        restrict: "E",
        templateUrl: "skins/timeline/components/tag.html",
        replace: true
    }
}]).directive("tinyTag", [function() {
    return {
        restrict: "E",
        template: '<div class="tinyTag"></div>',
        replace: true
    }
}]);
