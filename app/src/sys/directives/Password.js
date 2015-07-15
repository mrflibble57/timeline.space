'use strict';
var SysDirectivePassword = function(config, language) {
    return {
        restrict: "E",
        require: 'ngModel',
        scope: {
            bind: "=",
            errorMessages: "="
        },
        template: '<input type="password" ng-model="bind"></input>',
        replace: true,
        link: function($scope, element, attrs, ngModel) {
            config.bind($scope);
            var req = config.get("passwordStrength");
            console.log("PASSWORD REQ = ",req);
            //If we have no password requirements given, set to default
            if(!req){
                req = {minLength:8,requiresLetters:true,requiresNumbers:true,maximumRepeatedChars:3,maximumConsecutiveChars:3};
            }

            ngModel.$parsers.unshift(function(val) {
                return valid(val);
            });

            ngModel.$formatters.unshift(function(value) {
                return valid(value);
            });

            var valid = function(val) {
                var errorMessages = [];

               // console.log("PASSWORD VALID ["+$scope.errorMessages+"]= ",$scope);
                if (val == undefined || val == null)
                    val = "";
                var good = true;
                if (req.minLength && (val.length < req.minLength)){
                    good = false;
                    errorMessages.push(language.get(["passwordRequires","atLeast"],req.minLength));
                }
                if (req.maxLength && (val.length > req.maxLength)){
                    good = false;
                    errorMessages.push(language.get(["passwordRequires","lessThan"],req.maxLength));
                }
                if (req.requiresNumbers && !new RegExp(/[0-9]/).test(val)){
                    good = false;
                    errorMessages.push(language.get(["passwordRequires","number"]));
                }
                if (req.requiresLetters && !new RegExp(/[a-zA-Z]/).test(val)){
                    good = false;
                    errorMessages.push(language.get(["passwordRequires","letter"]));
                }
                if (req.mixedCase && !(new RegExp(/[a-z]/).test(val) && new RegExp(/[A-Z]/).test(val))){
                    good = false;
                    errorMessages.push(language.get(["passwordRequires","mixedCase"]));
                }
                if (req.maximumRepeatedChars) {
                    var ml = 0;
                    var mc = "";
                    for (var i = 0; i < val.length; i++) {
                        var c = val.charAt(i);
                        if (c == mc) {
                            ml++;
                            if (ml > req.maximumRepeatedChars) {
                                good = false;
                                errorMessages.push(language.get(["passwordRequires","maxRepeated"],req.maximumRepeatedChars));
                                break;
                            }
                        } else {
                            mc = "";
                            ml = 0;
                        }
                        mc = c;
                    }
                }
                if (req.maximumConsecutiveChars) {
                    var ml = 1;
                    var mc = -2;
                    for (var i = 0; i < val.length; i++) {
                        var c = val.charCodeAt(i);
                        if (c == mc + 1) {
                            ml++;
                            if (ml > req.maximumConsecutiveChars) {
                                good = false;
                                errorMessages.push(language.get(["passwordRequires","maxConsecutive"],req.maximumConsecutiveChars));
                                break;
                            }
                        } else
                            ml = 1;
                        mc = c;
                    }
                }
                //Only try to set on scope if it's been bound to something.
               // console.log("ERROR MESSAGES = ",errorMessages);
                if(typeof $scope.errorMessages != 'undefined'){
                    $scope.errorMessages = errorMessages;
                }
                ngModel.$setValidity("password", good);
                //console.log("RETURNING "+val);
                return val;
            }

        }
    };
};