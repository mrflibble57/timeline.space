angular.module('timelineModule').directive("editor", [function() {
    return {
        scope: {},
        require: "ngModel",
        restrict: "E",
        templateUrl: "skins/timeline/components/editor.html",
        replace: true,
        transclude: true,
        link: function(scope, el, attrs, ngModel) {
            var target = $(el).children("div[class='text']");

            attrs.$observe("value", function(val) {
                target.html(val);
            });

            ngModel.$render = function() {
                target.html(ngModel.$modelValue);
            };

            $(document).bind("keyup.editor", function() {
                var value = target.html();
                scope.$emit("updateValue", attrs.field, value);
            });

            scope.exec = function(fn) {
                target.focus();
                document.execCommand(fn, false, null);
            };

            scope.$on("$destroy", function() {
                $(document).unbind("keyup.editor");
            });

        }
    }
}]);
