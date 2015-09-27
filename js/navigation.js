/**
 * Created by n0232321 on 9/22/2015.
 */
var navigation = angular.module('navigation', ['events']);

navigation.controller('navigationCtrl', ['$scope', '$log', 'dispatch', function($scope, $log, dispatch){
    $scope.click = function(btn) {
        if (btn == 'playBtn') {
            dispatch(btn);
        }
    }
}]);