'use strict';
var SysDirectivePhoneInput = function() {

    var template = "";
    return {
        require: 'ngModel',
        restrict: "E",
        replace: true,
        scope : {
            bind: "="
        },
        template:'<input ng-model="bind" render-on-blur></input>',
        link: function(scope, elem, attrs, ctrl) {
            ctrl.$formatters.push(AusTelephoneFormatter);

            //Only allow numbers to be typed.
            elem.bind('keypress', function(evt) {
                var charCode = (evt.which) ? evt.which : event.keyCode
                if (charCode > 31 && (charCode < 48 || charCode > 57))
                    return false;
                return true;
            });
        }
    };
};

