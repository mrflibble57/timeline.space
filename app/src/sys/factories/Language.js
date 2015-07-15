angular.module('sysModule').factory("language", ["shout", "squirrel", "$rootScope", function(shout, squirrel, $rootScope){
    var loaded = false;
    var language = null;
    var queue = [];
    var currentLanguage = null;

    var load = function(value, returnFn) {
        loaded = false;
        currentLanguage = value;
        $.get("language/"+value+".txt", function(data) {
            squirrel.store("language", value, true);
            language = JSON.parse(data);
            loaded = true;
            bindAll();
            if (returnFn)
                returnFn(value);
        });
    };
    load(squirrel.get("language") || "en_AU");
    var apply = function(scope) {
        queue.push(scope);
        scope.$on('$destroy', function() {
            queue.splice(queue.indexOf(scope), 1);
        });
        if (loaded)
            bind(scope);
    };

    var bind = function(scope) {
        scope.language = language;
    };

    var bindAll = function() {
        for (var s in queue)
            bind(queue[s]);
        $rootScope.$apply();
        $rootScope.$broadcast("languageChanged");
    };

    return {
        load: load,
        bind: apply,
        get: function(value, rep) {
            if(value instanceof Array){
                var langObj = language;
                for(var i=0;i<value.length;i++){
                    langObj = langObj[value[i]];
                }
                return langObj.replace("{{1}}",rep);
            }
            else {
                return language[value].replace("{{1}}", rep);
            }
        },
        exception: function(reference, value, doShout) {
            doShout = doShout == undefined ? true : doShout;
            var exceptionId = null;
            if (value != undefined && value.hasOwnProperty("exceptionId")) {
                exceptionId =  value.exceptionId;
                if(exceptionId == null){
                    exceptionId = "";
                }
                if (doShout) {
                    var msg = language[reference][exceptionId];
                    var message = msg[1].replace("{{1}}", value.message);
                    var title = msg[0];
                    shout.out("notify", message, title, [language["okay"]]);
                }
            }
            return exceptionId;
        },
        currentLanguage: function() {
            return currentLanguage;
        }
    }
}]);