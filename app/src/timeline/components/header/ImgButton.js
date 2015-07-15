angular.module('timelineModule').directive("imageButton", ["$parse", function($parse) {
    return {
        scope: {
            label: "@",
            img: "@",
            selected: "=",
            disabled: "=",
            key: "@",
            keyCode: "@",
            fn: "@",
            index: "@"
        },
        restrict: "E",
        templateUrl: "skins/timeline/components/imgButton.html",
        replace: true,
        transclude: true,
        link: function(scope, elm, attrs, ctrl, $transclude){
            $transclude(function(clone){
                scope.hasContent = clone.length > 0;
            });

            $(elm)
                .bind("tapstart", function(ev) {
                    ev.stopPropagation();
                });

            if (scope.key || scope.keyCode) {
                var k = scope.keyCode || scope.key.toUpperCase().charCodeAt(0);
                var sh = false, ct = false;
                if (scope.fn) {
                    sh = scope.fn.indexOf("^") != -1;
                    ct = scope.fn.indexOf("#") != -1;
                }
                $(document).bind("keydown."+scope.$id, function(ev) {
                    var ctrlKey = ev.ctrlKey || ev.metaKey;

                    if (scope.$parent.$active && ev.which == k && ev.shiftKey == sh && ctrlKey == ct) {
                        scope.$parent.$apply($parse(attrs["ngClick"]));
                        ev.preventDefault();
                    }
                });
                scope.$on("$destroy", function() {
                    $(document).unbind("keydown."+scope.$id);
                });
            }


        }
    }
}]).directive("imageButtonSet", ["$parse", function($parse) {
    return {
        scope: {
            selected: "="
        },
        require: "ngModel",
        restrict: "E",
        template: "<div ng-transclude class=\"imgButtonSet\"></div>",
        replace: true,
        transclude: true,
        link: function (scope, elm, attrs, ngModel) {
            var target = null;
            ngModel.$render = function() {
                value = ngModel.$modelValue;
                if(target)
                    target.removeClass("selected");
                target = $(elm).children("span[data-index='" + value + "']");
                target.addClass("selected");
            };

        }
    }
}]);