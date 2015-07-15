var SysControllerLanguage = function ($scope, language, config, action, selected, closePopup) {

    var langs = [
        {id: "en_AU", label: "English (AU)"},
        {id: "es_ES", label: "Espanol (ES)"}
    ];
    $scope.languages = [];
    for (var l in langs) {
        var lo = $.extend({selected: selected == langs[l].id}, langs[l]);
        $scope.languages.push(lo);
    }

    $scope.complete = action.responder("changeLanguage")
        .init(function(value) {
            language.load(value, $scope.complete.handler);
            return selected;
        })
        .complete(function(value) {
            closePopup();
            return value;
        });

};