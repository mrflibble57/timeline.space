angular.module('sysModule').factory("router", ["$rootScope", "$location", "shout", "$q", "$templateRequest", "$sce", function($rootScope, $location, shout, $q, $templateRequest, $sce) {
    var routes = {};
    var gatekeepers = [];
    var current = null;
    var viewport = null;

    function switchRouteMatcher(hash, route) {
        var keys = route.keys,
            params = {};
        if (!route.regexp)
            return null;
        var m = route.regexp.exec(hash);
        if (!m)
            return null;
        for (var i = 1, len = m.length; i < len; ++i) {
            var key = keys[i - 1];
            var val = 'string' == typeof m[i] ? decodeURIComponent(m[i]) : m[i];
            if (key && val)
                params[key.name] = val;
        }
        return params;
    }

    function pathRegExp(path, opts) {
        var insensitive = opts.caseInsensitiveMatch,
            ret = {
                path: path,
                regexp: path
            },
            keys = ret.keys = [];

        path = path
            .replace(/([().])/g, '\\$1')
            .replace(/(\/)?:(\w+)([\?|\*])?/g, function(_, slash, key, option){
                var optional = option === '?' ? option : null;
                var star = option === '*' ? option : null;
                keys.push({ name: key, optional: !!optional });
                slash = slash || '';
                return ''
                    + (optional ? '' : slash)
                    + '(?:'
                    + (optional ? slash : '')
                    + (star && '(.+?)' || '([^/]+)')
                    + (optional || '')
                    + ')'
                    + (optional || '');
            })
            .replace(/([\/$\*])/g, '\\$1');

        ret.regexp = new RegExp('^' + path + '$', insensitive ? 'i' : '');
        return ret;
    }


    $rootScope.$on('$locationChangeSuccess', function() {
        var last = current,
            params,
            next,
            hash = $location.path().replace(/\/+$/, "");
        angular.forEach(routes, function(route) {
            if (params = switchRouteMatcher(hash, route)) {
                next = {
                    path: route.path,
                    controller: route.controller,
                    template: route.template,
                    templateUrl: route.templateUrl,
                    params: params
                };
                if (route.rules != undefined)
                    next.keys = route.rules;
            }
        });
        if (next) {
            var keys = next.hasOwnProperty("keys")?next.keys:null;
            var arrp = [];
            for (var gk in gatekeepers) {
                var p = $q.defer();
                arrp.push(p.promise);
                gatekeepers[gk](p, keys, next.params);

            }
            $q.all(arrp)
                .then(
                // success on gatekeeper functions
                function(value) {
                    current = next;
                    if (next) {
                        if (next.template)
                            return next.template;
                        var templateUrl = $sce.getTrustedResourceUrl(next.templateUrl);
                        if (angular.isDefined(templateUrl))
                            return $templateRequest(templateUrl);
                    }
                },
                function(value) {
                    //This is what happens when a gatekeeper function rejects the promise, the route has failed.
                    //In app.js, within the 'otherwise' section you can have a single default route  .otherwise({redirectTo:"/login"})
                    //or you can provide a function which can take the value passed to the reject call within the gatekeeper and do
                    //conditional logic routing:  .otherwise({redirectTo: function(value) { return (value =='invalidAccessAttempt') ? "/main" : "/login";} })
                    $location.path(typeof(routes[null].redirectTo) == 'function' ? routes[null].redirectTo(value) : routes[null].redirectTo);
                })
                .then(function(template) {
                    if (template) {
                        next.template = template;

                        $rootScope.$broadcast('$routeChangeSuccess', next, last);
                    }
                });
        }
        else {
            // console.log("NULL ROUTE");
            $location.path(typeof(routes[null].redirectTo) == 'function' ? routes[null].redirectTo() : routes[null].redirectTo);
        }

    });

    return {
        gatekeepers: function() {
            for (var a in arguments) {
                var gk = arguments[a];
                if (gk.hasOwnProperty("gatekeeper"))
                    gatekeepers.push(gk.gatekeeper);
            }
            return this;
        },
        goto: function(location) {
            $location.path(location);
            return this;
        },
        when: function(path, route, keys) {
            routes[path] = angular.extend(
                {rules: keys},
                route,
                path && pathRegExp(path, route)
            );
            return this;
        },
        otherwise: function(params) {
            this.when(null, params);
            return this;
        }
    };
}])
    .directive('viewport', ["$compile", "$controller", function($compile, $controller) {
    return {
        restrict: 'E',
        link: function(scope, element, attr) {
            var content;
            scope.$on('$routeChangeSuccess', function(ev, current) {
                if (content)
                    content.scope.$destroy();
                content = current;
                current.scope = scope.$new();
                current.scope.$params = current.params;
                element.empty().append($compile(current.template)(current.scope));
                if (content.controller)
                    $controller(content.controller, {$template: current.template, $scope: current.scope});
            });
        }
    };
}]);