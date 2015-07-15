angular.module('timelineModule').factory("timelineManager", ["shout", "$location", "language", "preload", "squirrel", "googleAuth", "imgurClientId", function(shout, $location, language, preload, squirrel, googleAuth, imgurClientId) {

    var user = null;
    var rejectOnAuthFail = true;
    var gkPromise = null;
    var rootDir = null;
    var map = null;
    var projectDir = null;

    var boundary = '-------314159265358979323846';
    var delim = "\r\n--" + boundary + "\r\n";
    var closeDelim = "\r\n--" + boundary + "--";
    var scope = "email https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.appdata";

    var cf = {
        title: "Timeline Space",
        subtitle: "",
        splashDelay: -1
    };
    preload.set(cf);

    var authInterval = null;

    function checkAuth(showWorking) {
        if (showWorking)
            shout.out("showWorking", "Authenticating");
        gapi.auth.authorize({client_id: googleAuth, scope: scope, immediate: true}, handleAuthResult);
    }

    function handleAuthResult(authResult) {


        if (authResult && !authResult.error) {
            if (!user) {
                authInterval = setInterval(checkAuth, 60000 * 45);
                shout.out("showWorking", "Getting User Information");
                gapi.client.load('plus','v1', function(){
                    gapi.client.plus.people.get({
                        'userId': 'me'
                    }).execute(function(resp) {
                        user = resp;
                        gapi.client.load('drive', 'v2').then(function() {
                            gapi.client.drive.files.get({
                                'fileId': 'appfolder'
                            }).execute(function (resp) {
                                rootDir = resp.id;
                                shout.out("hideWorking");
                                preload.closeSplash();
                                if (gkPromise) {
                                    gkPromise.resolve();
                                    gkPromise = null;
                                }

                            });
                        });

                    });
                });
            }
            else
            {
                shout.out("hideWorking");
                preload.closeSplash();
            }


        } else {
            preload.closeSplash();
            shout.out("hideWorking");
            console.log("fail auth");
            user = null;
            if (authInterval)
                clearInterval(authInterval);
            if (gkPromise) {
                if (rejectOnAuthFail)
                    gkPromise.reject();
                else
                    gkPromise.resolve();
                gkPromise = null;
            }
        }
    }

    function handleAuthClick(event) {

        window.location.href="https://accounts.google.com/o/oauth2/auth?state=/&redirect_uri=" + location.protocol+'//'+location.host + "&response_type=token&client_id="+googleAuth+"&scope="+scope;
//        gapi.auth.authorize({client_id: googleAuth, scope: scope, immediate: false, redirect_uri2: "http://beta.timeline.space/success.html"}, handleAuthResult);
    }

    var htmlify = function(string) {
        string = string.trim();
        var output = "";
        if (string.length > 0) {
            output = "<ul>";
            var split = string.trim().split(/\n/g);
            $.each(split, function (i, s) {
                output += "<li>";
                if (s.substr(0, 1) == "-")
                    output += "<ul><li>" + s.substr(1, s.length - 1).trim() + "</li></ul>";
                else
                    output += s;
            });
            output += "</li></ul>";
        }
        return output;
    };

    return {
        htmlify: htmlify,
        getProject: function(file, handler) {
            gapi.client.drive.files
                .get({
                    'fileId': file
                })
                .then(function(resp) {
                    map = resp.result;
                    projectDir = map. parents[0].id;
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', resp.result.downloadUrl);
                    xhr.setRequestHeader('Authorization', 'Bearer ' + gapi.auth.getToken().access_token);
                    xhr.onload = function() {
                        var project = JSON.parse(xhr.responseText);
                        project.label = map.title;
                        project.description = map.description;
                        handler(project);
                    };
                    xhr.send();
                }, function(resp) {
                    var err = resp.result.error;
                    shout.out("notify", err.message, "Error " + err.code);
                });
        },
        getProjects: function(handler) {

            gapi.client.drive.files.list({q:"'appfolder' in parents and trashed=false"})
                .then(function (resp) {
                    handler(resp.result.items);
                }, function (reason) {
                    console.log('Error: ' + reason.result.error.message);
                });

        },
        addProject: function(project, callback) {
            var contentType =  'application/octet-stream';
            var base64Data = btoa(JSON.stringify({
                items: [
                    {
                        id: 1,
                        type: 1,
                        label: "Initial",
                        items: [],
                        markers: [],
                        chains: [],
                        meta: {
                            x: 150,
                            y: 100,
                            offset: {x: 0, y: 0},
                            zoom: 0.8,
                            active: true
                        }
                    }
                ],
                meta: {
                    levels: [1],
                    tags: [],
                    uid: 1,
                    zoom: 1,
                    offset: {x: 0, y: 0}
                }
            }));
            var multipartRequestBody =
                delim +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(
                    {'mimeType': "application/json",
                        "title" : project.title,
                        "description": project.description,
                        "parents": [{
                            "id": rootDir
                        }]
                    }) +
                delim +
                'Content-Type: ' + contentType + '\r\n' +
                'Content-Transfer-Encoding: base64\r\n' +
                '\r\n' +
                base64Data +
                closeDelim;

            gapi.client.request({
                'path': '/upload/drive/v2/files/',
                'method': "POST",
                'params': {'uploadType': 'multipart', 'alt': 'json'},
                'headers': {
                    'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                },
                'body': multipartRequestBody})

                .execute(callback);
        },
        deleteProject: function(id, callback) {
            gapi.client.drive.files.delete({
                'fileId': id
            }).execute(callback);
        },
        updateDescription: function(project, callback) {
            gapi.client.drive.files.patch({
                'fileId': project.id,
                'resource': {
                    "title": project.title,
                    "description": project.description
                }
            }).execute(callback);
        },
        saveProject: function(project, callback, force) {
            gapi.client.drive.files
                .get({
                    fileId: map.id,
                    fields: "version"
                })
                .then(function(response) {
                    if (!force && response.result.version != map.version) {
                        callback({error: "outOfDate"});
                    }
                    else {
                        squirrel.store(map.id, project);
                        var content = angular.toJson(project);
                        // Updating the metadata is optional and you can instead use the value from drive.files.get.
                        var base64Data = btoa(content);
                        var multipartRequestBody =
                            delim +
                            'Content-Type: application/json\r\n\r\n' +
                            JSON.stringify(map) +
                            delim +
                            'Content-Type: application/octet-stream\r\n' +
                            'Content-Transfer-Encoding: base64\r\n' +
                            '\r\n' +
                            base64Data +
                            closeDelim;

                        gapi.client.request({
                            'path': '/upload/drive/v2/files/' + map.id,
                            'method': "PUT",
                            'params': {'uploadType': 'multipart', 'alt': 'json'},
                            'headers': {
                                'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                            },
                            'body': multipartRequestBody
                        }).execute(function (value) {
                            squirrel.remove(value.id);
                            map = value;
                            callback(value);
                        });
                    }
                });

        },
        exportProject: function(project, options, callback) {

            var html = "<h1>" + project.label + "</h1>";
            if (project.description.length > 0)
                html += "<i>" + project.description + "</i><br><br>";
            var tree = function(items) {
                $.each(items, function (index, item) {
                    if (item.meta.active) {
                        html += htmlify(item.label) + "<br><br>";
                        tree(item.items);
                    }
                });
            };
            tree(project.items, html);
            var ct = "application/octet-stream";
            var body =
                delim +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify({
                        'mimeType': ct,
                        "title": project.label
                        //"parents": [{
                        //    "id": projectDir
                        //}]
                    }) +
                delim +
                'Content-Type: ' + ct + '\r\n' +
                'Content-Transfer-Encoding: base64\r\n\r\n' +
                btoa(html) +
                closeDelim;

            gapi.client.request({
                'path': '/upload/drive/v2/files/',
                'method': "POST",
                'params': {'uploadType': "multipart", "convert": true},
                'headers': {
                    'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                },
                'body': body})
                .execute(function(file) {
                    callback(file);
            });

        },
        addImage: function(file, callback) {
            var auth = 'Client-ID ' + imgurClientId;
            var reader = new FileReader();
            reader.readAsBinaryString(file);
            reader.onload = function() {
                $.ajax({
                    url: 'https://api.imgur.com/3/image',
                    type: 'POST',
                    headers: {
                        Authorization: auth,
                        Accept: 'application/json'
                    },
                    data: {
                        image: btoa(reader.result),
                        type: 'base64'
                    },
                    success: function(result) {
                        callback(result.data.link);
                    }
                });
            };
        },
        login: handleAuthClick,
        user: function() { return user; },
        share: function(file) {
            var request = gapi.client.drive.permissions.list({
                'fileId': file.id
            });
            request.execute(function(resp) {
                console.log(resp.items);
            });
        },
        gatekeeper: function(promise, keys, params) {
            if (user)
                promise.resolve();
            else {
                rejectOnAuthFail = keys.login;
                gkPromise = promise;
                if (gapi.auth)
                    checkAuth(true);
                else {
                    var i = setInterval(function () {
                        if (gapi.auth) {
                            checkAuth(true);
                            clearInterval(i);
                        }
                    }, 100);
                }
            }
        }
    };
}]);