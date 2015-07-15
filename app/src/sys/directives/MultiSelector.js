'use strict';
var SysDirectiveMultiSelector = function($popup) {

    return {
        restrict: "E",
        //require: "^ngModel",
        scope: {
            options: "=",
            selected: "=",
            label: "@",
            value: "@"
        },
        template: '<span><div style="display: inline-block; background-color: #eeeeee; padding: 4px; border-radius: 5px"><button ng-click="show()">Select</button>&nbsp;&nbsp;<span ng-repeat="opt in options" ng-show="opt.selected">{{opt.label}}&nbsp;&nbsp;</span></div></span>',
        replace: true,
        link: function(scope, element, attrs, ngModel) {
            scope.show = function() {
                $popup.open({
                    templateUrl: "skins/sys/multiSelectorPopup.html",
                    controller: SysControllerMultiSelector,
                    relative: element,
                    lockCorners: true,
                    apply: {
                        options: scope.options
                    }
                });
            };
        }
    };
};