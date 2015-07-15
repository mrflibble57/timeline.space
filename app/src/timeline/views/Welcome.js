angular.module('timelineModule').controller("Welcome", ["$scope", "shout", "router", "stacker", "language", "timelineManager", function ($scope, shout, router, stacker, language, timelineManager) {

    $scope.projects = null;
    $scope.user = timelineManager.user();
    $scope.loggedIn = $scope.user != null;
    $scope.loaded = false;
    console.log($scope.user)

    $scope.login = function() {
        timelineManager.login();
    };

    var getProjects = function() {
        timelineManager.getProjects(function(projects) {
            $scope.projects = projects;
            $scope.loaded = true;
            $scope.$apply();
            shout.out("hideWorking");
        });
    };

    if ($scope.loggedIn)
        getProjects();

    $scope.select = function(value) {
        router.goto("project/" + value.id);
    };

    $scope.test = function(value) {
        router.goto("project/" + value);
    };

    $scope.revoke = function() {
        window.open("https://security.google.com/settings/security/permissions?pli=1");
    };

    $scope.$on("shareProject", function(ev, file) {
        timelineManager.share(file);
    });

    $scope.addProject = function() {
        editProject({title: "New Project", description: ""},
            function(value) {
                stacker.pop();
                shout.out("showWorking", "Saving Project");
                timelineManager.addProject(value, getProjects)
            });
    };

    $scope.$on("deleteProject", function(ev, project) {
        shout.out("notify", "Are you sure you want to delete '" + project.title + "'?", "Delete", ["Yes", "No"], function(result) {
            if (result == 0) {
                shout.out("showWorking", "Deleting Project");
                timelineManager.deleteProject(project.id, getProjects);
            }
        })
    });

    var editProject = function(value, completeFn) {
        stacker.push({
            templateUrl: "skins/timeline/popups/project.html",
            width: 300,
            language: true,
            apply: {
                project: $.extend({}, value),
                complete: completeFn
            }
        });
    };

    $scope.$on("renameProject", function(ev, value) {
        editProject(value, function(data) {
            if (data.title) {
                stacker.pop();
                shout.out("showWorking", "Saving");
                timelineManager.updateDescription(data, getProjects);
            }
        });
    });

}]);
