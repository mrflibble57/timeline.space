'use strict';
var SysDirectiveDatePicker = function() {
    return {
        restrict: "E",
        scope: {
            bind: "@"
        },
        template: '<input type="datepicker" ng-model="bind"></input>',
        replace: true,
        link: function($scope, element, attrs) {

            element.addEventListener("click", function(ev) {
                console.log("345345345");
            })

        }
    };
};