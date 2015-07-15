angular.module('timelineModule').controller("Item", ["$scope", "shout", "upload", function ($scope, shout, upload) {

    $scope.$on("updateValue", function(ev, field, value) { $scope.item[field] = value; });
    $scope.upload = function(file) {
        shout.out("showWorking", "Uploading Image");
        upload(file, function(value) {
            shout.out("hideWorking");
            $scope.item.src = value;
            $scope.$apply();
        });
    };

}]);