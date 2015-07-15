'use strict';

var SysControllerMultiSelector = function ($scope, options, closePopup) {
    $scope.options = options;

    $scope.select = function(value) {
        value.selected = !value.selected;
    }

};