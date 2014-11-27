angular.module('anol', [])
/**
 * @ngdoc object
 * @name anol.DefaultMapName
 */
.constant('DefaultMapName', 'anol-map')
// found at http://stackoverflow.com/a/21098541
.filter('html',['$sce', function($sce) {
    return function(input){
        return $sce.trustAsHtml(input);
    };
}]);
