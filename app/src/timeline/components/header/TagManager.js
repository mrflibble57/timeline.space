/* timeline.directive("selectedTags", ["stacker", "shout", function(stacker, shout) {
    return {
        restrict: "E",
        scope: {},
        require: "ngModel",
        templateUrl: "skins/timeline/components/selectedTags.html",
        link: function(scope, e, a, ngModel) {
            scope.tags = [];
            ngModel.$render = function() {
                scope.tags = ngModel.$modelValue;
            };
        },
        replace: true
    };
}]);
*/
angular.module('timelineModule').controller("TagManager", ["$scope", "reposition", "uid", function ($scope, reposition, uid) {

    $scope.add = function() {
        $scope.tags.push({id: uid(), colour: "#999999", label: "", selected: true});
        reposition();
    };

    $scope.remove = function(tag) {
        $scope.tags.splice($scope.tags.indexOf(tag), 1);
    };

}]).controller("TagSelector", ["$scope", function ($scope) {

    $(document)
        .bind("keydown.selecttags", function(ev) {
            var isa = function(arr) {
                match = arr.indexOf(ev.which) != -1;
                return match;
            };
            if (isa([49,50,51,52,53,54,55,56,57])) {       // numbers 1- 9
                var i = ev.which - 49;
                if (i < $scope.tags.length)
                    $scope.select($scope.tags[i]);
            }
            if (isa([48])) {
                $scope.select(null);
            }
        });

    $scope.$on("$destroy", function() {
        $(document).unbind("keydown.selecttags");
    });
}]).controller("TagItemSelector", ["$scope", "tags", "projectTags", "reposition", function ($scope, tags, projectTags, reposition) {
    var allTags = [];
    $.each(projectTags, function(i, t) {
        allTags.push({id: t.id, selected: top ? t.selected : false, label: t.label, colour: t.colour});
    });
    $.each(tags, function(i, t) {
        var found = false;
        $.each(projectTags, function(i, pt) {
            if (t.label == pt.label && t.colour == pt.colour) {
                pt.selected = true;
                found = true;
            }
        });
        if (!found)
            allTags.push({selected: true, label: t.label, colour: t.colour, editable: true});
    });

    $scope.tc = allTags;

    $scope.add = function() {
        $scope.tc.push({id: uid(), colour: "#999999", label: "", selected: true, editable: true});
        reposition();
    };

    $scope.propagate = function() {
        $scope.$emit("updateTags", $scope.projectTags, projectTags);
    };

    $scope.save = function() {
        while (itemTags.length > 0)
            itemTags.pop();
        $.each(allTags, function(i, tag) {
            if (!$scope.top) {
                if (tag.selected && tag.label.length > 0)
                    itemTags.push({label: tag.label, colour: tag.colour});
            }
            else {
                delete tag.editable;
                if (tag.label.length > 0)
                    itemTags.push(tag);
            }
        });
        $scope.$close();
    };

}]);