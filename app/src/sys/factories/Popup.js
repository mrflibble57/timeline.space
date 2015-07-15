angular.module('sysModule').factory("popup", ["$document", "$compile", "$rootScope", "$q", "$http", "$templateCache", "$templateRequest", "$controller", "language", function ($document, $compile, $rootScope, $q, $http, $templateCache, $templateRequest, $controller, language) {

    var body = $document.find('body').eq(0);
    var instance = null;
    var relative = null;
    var relativeObject = null;
    var currentController = null;
    var clickOutside = false;
    var clickOutsideStuff = null;
    var openAtMouse = false; //Rather than opening relative to an object, open at the current mouse pos
    var followMouse = false; //Follow the mouse movements until closed? (Not valid unless openAtMouse == true)
    var positionOffset = {top:0,left:0};
    var lockCorners = false;
    var verifiedPos = {top:NaN, left:NaN};
    var pos = {};
    var target = {};
    var bounds = {};

    var close = function() {
        if(instance){
            instance.view.remove();
            instance.scope.$destroy();
            instance.scope = null;
            instance = relative = relativeObject = null;

            $(document).unbind("mousedown.popup");
            $(document).unbind("touchstart.popup");
            $(document).unbind("resize");
            $(document).unbind("mousemove.openAtMouse");
            clickOutsideStuff = null;
        }
    };

    $(window).resize(close);
    $(document)
        .mousedown(function(ev) {
            if (!instance)
                return;
            if (!clickOutsideStuff)
                clickOutsideStuff = {o: $(instance.view), r: $(relativeObject)};
            var evt = ev.target;
            if (!clickOutsideStuff.o.is(evt) && clickOutsideStuff.o.has(evt).length === 0 && !clickOutsideStuff.r.is(evt) && clickOutsideStuff.r.has(evt).length === 0) {
                close();
            }

        });

    var position = function() {
        if (!instance)
            return;
        var iv = $(instance.view);
        target = {width: iv.outerWidth(), height: iv.outerHeight()};
        bounds = {width: $(window).width(), height: $(window).height()};
        verifiedPos = {top:NaN, left:NaN};
        if (!relative && !openAtMouse) {    // centre it!
            verifiedPos = {top: (bounds.height - target.height) / 2, left: (bounds.width - target.width) / 2};
            applyPosition();
        }
        else if (relative) {
            var source = relative.offset();
            source.width = relative.outerWidth();
            source.height =  relative.outerHeight();
            source.right = source.left + source.width;
            source.bottom = source.top + source.height;
            pos = {
                top: source.top - target.height,
                bottom: source.bottom,
                center: source.left + ((source.width - target.width) / 2),
                left: source.left - target.width,
                right: source.right,
                middle: source.top + ((source.height - target.height) / 2),
                leftCorner: source.left,
                rightCorner: source.right - target.width,
                topCorner: source.top,
                bottomCorner: source.bottom - target.height
            };
            adjustPosition();
            applyPosition();
        }
        else if(openAtMouse){
            $(document).bind("mousemove.openAtMouse", captureMouse);
        }

    };

    var captureMouse = function(e){
        pos = {
            top:  e.y + positionOffset.top,
            bottom:  e.y + positionOffset.top+3,
            middle: e.y + positionOffset.top+1,

            left: e.x + positionOffset.left,
            right: e.x + positionOffset.left+3,
            center: e.x + positionOffset.left+1,

            leftCorner:  e.x + positionOffset.left,
            rightCorner: e.x + positionOffset.left+3,
            topCorner: e.y + positionOffset.top,
            bottomCorner: e.y + positionOffset.top+3
        };
        adjustPosition();
        applyPosition();
        if(!followMouse){
            document.removeEventListener("mousemove",captureMouse);
        }
    };

    /**
     * Adjust the position of the popup to cater for screen bounds (don't want it dissapearing off
     * the edge of the screen).
     */
    var adjustPosition = function(){
        if (pos.bottom + target.height < bounds.height) {    // bottom
            verifiedPos.top = pos.bottom;
        }
        else if (pos.top > 0 && pos.top + target.height < bounds.height) {   // top
            verifiedPos.top = pos.top;
        }
        else if (pos.right + target.width < bounds.width)   // right
            verifiedPos.left = pos.right;
        else if (pos.left > 0 && pos.left + target.width < bounds.width)     // left
            verifiedPos.left = pos.left;

        if (isNaN(verifiedPos.left)) {
            if (lockCorners)
                verifiedPos.left = (pos.leftCorner + target.width < bounds.width) ? pos.leftCorner : pos.rightCorner;
            else {
                if (pos.center > 0 && pos.center + target.width < bounds.width)
                    verifiedPos.left = pos.center;
                else {
                    if (pos.center + target.width > bounds.width) {
                        verifiedPos.left = bounds.width - target.width;
                    }
                }
            }
        }
        if(isNaN(verifiedPos.top)) {
            if (lockCorners)
                verifiedPos.top = (pos.topCorner >= 0) ? pos.topCorner : pos.bottomCorner;
            else {
                if (pos.middle >= 0 && (pos.middle + target.height) < bounds.height) {
                    verifiedPos.top = pos.middle;
                }
                else if (pos.middle + target.height > bounds.height) {
                    verifiedPos.top = bounds.height - target.height;
                }
            }
        }
    };

    var applyPosition = function(){
        instance.view.css({left:verifiedPos.left+"px", top:verifiedPos.top+"px", visibility: "visible"});
    };

    return {
        open: function (options) {
            if (relative && options.relative == relativeObject && currentController == options.controller)
                return;
            if (instance)
                close();
            $q.when(options.template ? $q.when(options.template) : $templateRequest(options.templateUrl))
            .then(
                function resolveSuccess(template) {
                    instance = {};
                    lockCorners = options.hasOwnProperty("lockCorners") ? options.lockCorners : false;
                    if (!options.pass)
                        options.pass = {};
                    options.pass.$scope = $.extend((options.scope || $rootScope).$new(), options.apply);
                    options.pass.$scope.$close = close;
                    if (options.language)
                        language.bind(options.pass.$scope);
                    currentController = options.hasOwnProperty("controller") ? options.controller : null;
                    if (options.controller) {                                           // if there's a controller
                        $controller(options.controller, options.pass);
                    }
                    var angularDomEl = angular.element('<div id="popup"></div>');
                    angularDomEl.html(template);
                    instance.view = $compile(angularDomEl)(options.pass.$scope);
                    instance.scope = options.pass.$scope;
                    body.append(instance.view);
                    if (options.hasOwnProperty("relative")) {
                        relativeObject = options.relative;
                        relative = $(options.relative);
                    }
                    else
                        relative = relativeObject = null;

                    openAtMouse = options.hasOwnProperty("openAtMouse") ? options.openAtMouse : false;
                    followMouse = options.hasOwnProperty("followMouse") ? options.followMouse : false;
                    positionOffset = options.hasOwnProperty("positionOffset") ? options.positionOffset : {top:0,left:0};

                    setTimeout(function() {
                        position();
                    }, 10);
                }, function resolveError(reason) {
                    $q.defer().reject(reason);  // not needed?
                }
            );
        },
        close: function() {
            close();
        },
        active: function() {
            return instance != null;
        }
    }
}]);