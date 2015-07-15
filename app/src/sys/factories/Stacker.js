angular.module('sysModule').factory("stacker", ["$compile", "$rootScope", "$q", "$templateRequest", "$controller", "language", function ($compile, $rootScope, $q, $templateRequest, $controller, language) {
    var body = $('body');
    var html = $('html');
    var win = $(window);
    var stack = [];
    var queue = [];
    var bg = null;
    var overflow;
    var animating = false;
    var watchForEscape = false;
    var defaults = {
        animationLength: 200,
        backgroundOpacity: .6,
        addScrollOffset: 150
    };

    var push = function (view) {
        if (animating) {
            queue.push(view);
            return;
        }
        animating = true;
        $q
            .when(view.template ? $q.when(view.template) : $templateRequest(view.templateUrl))
            .then(
                function resolveSuccess(template) {
                    if (stack.length > 0) {
                        var last = stack[stack.length-1];
                        last.scope.$active = false;
                    }

                    if (!view.pass)
                        view.pass = {};

                    $rootScope.$emit("active", false);

                    view.pass.$scope = (view.scope || $rootScope).$new();
                    if (view.language)
                        language.bind(view.pass.$scope);
                    if (view.hasOwnProperty("$destroy") && typeof view.$destroy == "function")
                        view.pass.$scope.$on("$destroy", view.$destroy);
                    view.pass.$scope.$active = true;
                    view.pass.$scope.$close = pop;
                    view.pass.$scope.allowCancel = view.hasOwnProperty("allowCancel") ? view.allowCancel : true;
                    $.extend(view.pass.$scope, view.apply);
                    if (view.controller)
                        $controller(view.controller, view.pass);

                    var angularDomEl = angular.element('<div class="stacker" style="display: none; opacity: 0"><div class="stackerCover"></div></div>');
                    angularDomEl.append(template);
                    if (view.width)
                        angularDomEl.css({"width": view.width + "px"});
                    var instance = {
                        allowCancel: view.pass.$scope.allowCancel,
                        new: true,
                        view: $($compile(angularDomEl)(view.pass.$scope)),
                        scope: view.pass.$scope,
                        caller: view.scope
                    };
                    body.append(instance.view);
                    stack.push(instance);
                    setTimeout(init, 50); // give it a chance to complete building
                }, function resolveError(reason) {
                    $q.defer().reject(reason);  // not needed?
                }
            );
    };

    var pop = function() {
        var instance = stack.pop();
        if (instance) {
            animating = true;
            instance.view.animate({
                opacity: 0,
                top: "+=" + defaults.addScrollOffset
            }, defaults.animationLength, function () {
                instance.view.remove();
                instance.scope.$destroy();
                instance.scope = null;
                instance = null;
                $rootScope.$emit("active", true);
                if (queue.length == 0) {
                    reposition(true);
                    if (stack.length == 0) {
                        if (bg)
                            bg.animate({opacity: 0}, defaults.animationLength, function () {
                                bg.remove();
                                bg = null;
                                html.css({"overflow-y": overflow});
                                animating = false;
                                win.unbind("keydown.stack");
                                watchForEscape = false;
                            });
                    }
                    else {
                        var last = stack[stack.length-1];
                        last.scope.$active = true;
                    }
                }
                else
                    checkQueue();
            });
        }
    };

    var reposition = function() {
        animating = true;
        var gap = 40;
        var offset = 0;
        var first = true;
        for (var index = stack.length-1; index >= 0; index--) {
            var instance = stack[index];
            var view = instance.view;
            var dim = {width: view.outerWidth(), height: view.outerHeight()};
            var tp = (win.height() - dim.height) / 2;
            var lp;
            if (first) {
                view.removeClass("stackerDisabled");
                offset = lp = (win.width() - dim.width) / 2;
                first = false;
                if (instance.new) {
                    view.css({left: lp, top: tp - defaults.addScrollOffset});
                    delete instance.new;
                }
            }
            else {
                view.addClass("stackerDisabled");
                offset -= dim.width + gap;
                lp = offset;
            }
            view.css({display: "block", "z-index": 901 + (stack.length - index)})
                .finish()
                .animate({
                    opacity: 1,
                    left: lp,
                    top: tp
                }, defaults.animationLength, checkQueue);
        }
    };

    var checkQueue = function() {
        animating = false;
        if (queue.length > 0) {
            push(queue.shift());
        }
    };

    var init = function() {
        if (!bg) {
            overflow = html.css("overflow-y");
            html.css({"overflow-y": "hidden"});
            bg = $('<div id="stackerBG"></div>');
            var op = bg.css("opacity");
            bg.css({opacity: 0}).animate({opacity: defaults.backgroundOpacity}, defaults.animationLength);
            body.append(bg);
        }
        if (!watchForEscape) {
            win.bind("keydown.stack", function(ev) {
                var instance = stack[stack.length-1];
                if (instance && instance.allowCancel && ev.which === 27) {
                    ev.preventDefault();
                    pop();
                }
            });
            watchForEscape = true;
        }
        reposition(true);
    };

    win.resize(function() {
        if (stack.length > 0)
            reposition();
    });

    return {
        push: push,
        pop: pop,
        reposition: reposition,
        config: function(values) {
            $.extend(defaults, values);
        },
        clear: function() {
            while (stack.length > 0)
                pop();
        },
        active: function() {
            return stack.length > 0;
        }
    }
}]);