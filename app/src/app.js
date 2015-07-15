angular.module("timeline", ["timelineModule", "sysModule", "ngCookies", "ngSanitize"])
    .value("imgurClientId", "78e33e3dd496e47")
    .value("googleAuth", "236891801069-irhk9muuhvmd44s0q8a2lc4jd4eadnqe.apps.googleusercontent.com")
    .config(["$locationProvider", function ($locationProvider) {
        $locationProvider.html5Mode(false);
    }])
    .run(["timelineManager", "router", function(timelineManager, router) {
        router
            .gatekeepers(timelineManager)
            .when('/projects', {templateUrl: 'skins/timeline/views/projects.html', controller: 'Projects'}, {login: true})
            .when('/project/:id', {template: '<project></project>'}, {login: true})
            .when('/welcome', {templateUrl: 'skins/timeline/views/welcome.html', controller: 'Welcome'}, {login: false})
            .when('/state=/:token', {templateUrl: 'skins/timeline/views/welcome.html', controller: 'Welcome'}, {login: false, authenticate: true})
            .otherwise({redirectTo: '/welcome'});
    }]);