/**
 * Via. http://stackoverflow.com/questions/11380866/angularjs-how-to-force-an-input-to-be-re-rendered-on-blur
 * On Blur: Show a formatted version of the value, based on formatters applied within the directive
 * (see PhoneInput for example)
 * On Focus: Show raw value for editing
 * Stored = Raw Value
 */
sys.directive('renderOnBlur',[function()  {
    return {
        require: 'ngModel',
        restrict: 'A',
        link: function(scope, elm, attrs, ctrl) {
            var applyFormatters = function() {
                var viewValue = ctrl.$modelValue;
                for (var i in ctrl.$formatters) {
                    viewValue = ctrl.$formatters[i](viewValue);
                }

                ctrl.$viewValue = viewValue;
                ctrl.$render();
            };

            applyFormatters();


            elm.bind('blur', applyFormatters);

            elm.bind('focus', function() {
                ctrl.$viewValue = ctrl.$modelValue;
                ctrl.$render();
            });
        }
    };
}]);
