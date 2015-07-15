/**
 * System Config file loading and access.
 * On Verify, loads config file if not in memory. Then provides get method to access contents.
 *
 * Config file as retrieved from server is XML. We convert to JSON
 * @param squirrel
 * @param shout
 * @returns {{validate: Function, get: Function}}
 * @constructor
 */
angular.module('sysModule').factory("preload", ["$rootScope", "squirrel", "shout", "language", function($rootScope, squirrel, shout, language){

    $rootScope.$active = false;
    var preload = null;
    var loaded = false;

    var queue = [];
    var apply = function(scope) {
        queue.push(scope);
        scope.$on('$destroy', function() {
            queue.splice(queue.indexOf(scope), 1);
        });
        if (loaded)
            bind(scope);
    };

    var bind = function(scope) {
        scope.preload = preload;
    };

    var bindAll = function() {
        for (var s in queue)
            bind(queue[s]);
    };

    var closeSplash = function() {
        $("#splash").css("display", "none");
        $rootScope.$active = true;
    };

    return {
        bind: apply,
        get: function(value) {
            if(preload){
                if(preload[value] == undefined ){
                    return null;
                }
                else{
                    //Doing this returns a copy of the object rather
                    //than a reference
                    return JSON.parse(JSON.stringify(preload[value]))
                }
            }
            else{
                return null;
            }
        },
        set: function(loadedConfig) {
            if(!loadedConfig){
                shout.out("notify",language.get(["configLoadError","text"]), language.get(["configLoadError","title"]));
                return null;
            }
            preload = loadedConfig;
            document.title = (preload.title || document.title) + (preload.subtitle? " - " + preload.subtitle : "");
            if (preload.hasOwnProperty("defaultLanguage"))
                squirrel.store("language", preload.defaultLanguage, true);
            if (preload.hasOwnProperty("stylesheet") && preload.stylesheet.length > 0)
                $("<link/>", {
                    rel: "stylesheet",
                    type: "text/css",
                    href: preload.stylesheet
                }).appendTo("head");
            var dt = preload.splashDelay || 0;
            if (dt >= 0)
                setTimeout(function() {
                   closeSplash();
                }, dt);
            loaded = true;
            bindAll();
            shout.out("configLoaded", preload);
        },
        closeSplash: closeSplash
    }
}]);