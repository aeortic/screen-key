/**
 * Created by n0232321 on 9/22/2015.
 */
var events = angular.module('events', []);

events.factory('dispatch', function($rootScope){
    return function(message, payload) {
        $rootScope.$broadcast(message, payload);
    }
});