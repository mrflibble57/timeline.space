'use strict';

var SysFactoryService = function(shout, $http, language) {
    var loc = window.location;
    var location = loc.protocol + "//" + loc.host + loc.pathname + "/recast/";//"http://localhost:8080/JSON/recast/";
    var sessionTimeoutNotified = false;
    shout.listen("loginComplete", function(user){if(user){sessionTimeoutNotified = false;}});

    return {
        call: function(service, data, callback) {
           // console.log("SERVICE CALL "+service+" with ["+data+"]");
            var postData = (data != null) ? JSON.stringify(data) : data;
            var promise = $http({withCredentials: true,
                method:"POST",
                url: location + service,
                data: postData});
            promise.success(function(data) {
                   // console.log("SERVICE CALL "+service+" Success :",data);
                    if (data) {
                        if (data.hasOwnProperty("exceptionId") && data.exceptionId < 0) {
                            //This will notify user of  expired session if it's the call attempted after expiry
                            if(language.exception("errServerError", data,false) == -2){
                                if(!sessionTimeoutNotified) {
                                    language.exception("errServerError", data);//notify
                                    sessionTimeoutNotified = true;
                                }
                                console.log("LOGOUT DUE TO SERVER ERROR ",data);
                                shout.out("logout");
                            }

                        }
                        if (callback) {
                            if (data == "false")
                                data = false;
                            else if (data == "true")
                                data = true;
                            if (callback instanceof Function)
                                callback(data);
                            else if (callback instanceof Array) {
                                //'!callback[1]' = sometimes 'handler' (return fn) can be passed as practice, but be
                                //undefined, so we get an array of 2, but really 2nd spot is empty
                                if (callback.length == 1 || !callback[1])
                                    callback[0](data);
                                else
                                    callback[1](callback[0](data));
                            }
                        }
                    }
                    else if (callback) {
                        if (callback instanceof Function)
                            callback();
                        else if (callback instanceof Array) {
                            if (callback.length == 1)
                                callback[0]();
                            else
                                callback[1](callback[0]());
                        }
                    }

                } )
            promise.error(function() {
                    console.log("SERVICE CALL "+service+" Failure :",data);
                    shout.out("hideWorking");
                    shout.out("notify","Error in "+service+":"+data.message,"Server Error");
                });
            return promise;
        },
        setLocation: function(value) {
            console.log("SET LOCATION = "+value);
            location = value;
        }
    };

};