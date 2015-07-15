angular.module('timelineModule').factory("timelineManager", ["shout", "$location", "language", "config", "googleAuth", function(shout, $location, language, config, googleAuth) {

    var user = {name: "Ben"};
    var rejectOnAuthFail = true;
    var gkPromise = null;
    var rootDir = null;
    var map = null;
    var projectDir = null;

    var boundary = '-------314159265358979323846';
    var delim = "\r\n--" + boundary + "\r\n";
    var closeDelim = "\r\n--" + boundary + "--";
    var scope = "email https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.appdata";

    config.set({
        title: "Timeline Space",
        subtitle: "",
        splashDelay: 4000
    });

    var authInterval = null;




    return {
        getProject: function(file, handler) {
            setTimeout(function() {
                handler({"items":[{"id":1,"type":2,"label":"Main Timeline","items":[{"type":1,"id":2,"index":1,"label":"000","text":"","tags":[],"meta":{"x":169.67827887072082,"y":221.80408585204407,"active":true,"selected":false}},{"type":1,"id":3,"index":2,"label":"111","text":"sdfgsrtewrtser","tags":[],"meta":{"x":546.4360913707206,"y":446.06189835204407,"active":true,"selected":false}},{"type":2,"id":4,"index":3,"label":"aaaaaaaaaaaaa","items":[{"type":2,"id":7,"index":1,"label":"werwerwer","items":[{"type":1,"id":9,"index":1,"label":"","text":"","tags":[],"meta":{"x":82.98828125,"y":143.984375,"active":true}},{"type":1,"id":10,"index":2,"label":"werwrwe","text":"werwerwerwer","tags":[],"meta":{"x":368.984375,"y":282.98828125,"active":true,"selected":false}},{"type":1,"id":11,"index":3,"label":"","text":"","tags":[],"meta":{"x":605,"y":151.9921875,"active":true}},{"type":1,"id":12,"index":4,"label":"","text":"","tags":[],"meta":{"x":937.5,"y":319.4921875,"active":true}},{"type":1,"id":13,"index":5,"label":"","text":"","tags":[],"meta":{"x":1258.49609375,"y":163.75,"active":true}}],"markers":[],"chains":[],"zoom":0.8,"meta":{"x":637.24609375,"y":242.5,"active":true,"selected":false}},{"type":2,"id":8,"index":2,"label":"","items":[],"markers":[],"chains":[],"zoom":0.8,"meta":{"x":1045,"y":135,"active":true}}],"markers":[],"chains":[],"zoom":0.8,"meta":{"x":1011.924372620721,"y":237.56580460204407,"active":true,"selected":false}}],"markers":[{"id":1,"label":null,"sliplane":false,"offset":882.6860913707209}],"chains":[{"bw":[2,3],"tags":[]},{"bw":[3,4],"tags":[]}],"zoom":0.7073479710000001,"meta":{"x":164,"y":87,"active":true,"selected":false},"index":1}],"zoom":1,"meta":{"drag":0,"mode":3,"space":[1],"uid":13,"tags":[{"key":"1","colour":"#c69c6c","label":"asdfasfasdf","selected":true},{"key":"2","colour":"#ffd60a","label":"zzza","selected":true}]}});
            }, 1000);
        },
        getProjects: function(handler) {
            setTimeout(function() {handler([{
                id: 1,
                label: "Local Test",
                description: "Nothing ventured, nothing saved",
                modifiedDate: new Date().toString(),
                map: "local"
            }])}, 1000);
        },
        addProject: function(project, callback) {

        },
        deleteProject: function(id, callback) {
            callback();
        },
        updateDescription: function(project, callback) {
            callback();
        },
        saveProject: function(project, callback) {
            callback();
        },
        addFile: function(file, callback) {
            callback();
        },
        exportProject: function(project, style, callback) {

        },
        user: function() { return user; },
        gatekeeper: function(promise, keys, params) {
            promise.resolve();

        }
    };
}]);