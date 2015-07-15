sys.directive('global', ["$rootScope", "shout", "stacker", "language", function($rootScope, shout, stacker, language) {

    return {
        restrict: "E",
        link: function(scope, elem, attr) {

            shout.listen("notify", function(text, title, buttons, resultFn, options) {
                options = options || {};
                var apply = $.extend({
                    title:  title,
                    text:  text,
                    buttons: buttons || [language.get('okay')],
                    result: resultFn || function() {},
                    allowCancel: true
                }, options);
                apply.select = function(value) {
                    stacker.pop();
                    resultFn(value);
                };
                stacker.push({
                    templateUrl: attr.notify || "skins/sys/notifier.html",
                    language: true,
                    width: options.width || 600,
                    allowCancel: apply.allowCancel,
                    apply: apply
                });
            });

            shout.listen("input", function(text, title, value, resultFn, options) {
                options = options || {};
                options.accept = function(value) {
                    if (options.allowEmpty || value != "") {
                        resultFn(value);
                        stacker.pop();
                    }
                };
                stacker.push({
                    templateUrl: attr.inputter || "skins/sys/inputter.html",
                    width: options.width || 600,
                    language: true,
                    allowCancel: options.hasOwnProperty("allowCancel") ? options.allowCancel : true,
                    apply: $.extend(
                        {
                            title: title,
                            text: text,
                            value: value,
                            allowEmpty: false,
                            allowCancel: true
                        }, options)
                });
            });

            var open = false;
            shout.listen("showWorking", function(text) {
                if ($rootScope.$active) {
                    if (!open) {
                        open = true;
                        stacker.push({
                            templateUrl: attr.working || "skins/sys/working.html",
                            language: true,
                            controller: "Working",
                            allowCancel: false,
                            width: 200,
                            apply: {
                                text: text
                            }
                        });
                    }
                    else {
                        shout.out("workingText", text);
                    }
                }
                else {
                    $("#splashMessage").text(text);
                }
            });

            shout.listen("hideWorking", function(){
                if (open) {
                    open = false;
                    stacker.pop();
                }
            });


            shout.listen("select", function(text, title, selections, resultFn, options) {
                options = options || {};
                var returnKey = options.returnKey;
                //var returnAsIndex = options.returnAsIndex || null;
                var apply = $.extend({
                    title: title,
                    text: text,
                    selections: selections,
                    selectedItem: null,
                    allowCancel: true,
                    allowEmpty: false
                }, options);
                apply.select = function(value) {
                    if (options.allowEmpty || value != null) {
                        if (returnKey)
                            value = value[returnKey];
                        resultFn(value);
                        stacker.pop();
                    }
                };
                stacker.push({
                    templateUrl: attr.select || "skins/sys/selector.html",
                    language: true,
                    width: options.width,
                    allowCancel: apply.allowCancel,
                    apply: apply
                });
            });

        }
    };
}])
    .controller('Working', ["$scope", "shout", function ($scope, shout) {
    var updateText = function(value) {
        $scope.text = value;
        $scope.$apply();
    };

    shout.listen("workingText", updateText);
    $scope.$on("destroy", function() {
        shout.snub("workingText", updateText);
    });
}]);