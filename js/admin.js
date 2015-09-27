/**
 * Created by n0232321 on 9/18/2015.
 */
etaApp.controller('adminCtrl', ['$scope', 'deleteActivity', 'createActivity', function($scope, deleteActivity, createActivity) {
    $scope.message = "Change the scenario 'user data' that the learner will begin with."
    $scope.delete = function(id) {
        var toDelete = confirm("Delete the activity with work order number of "+id+"?");
        if (toDelete)
        {
            deleteActivity(id);
        }
    }

    $scope.createActivity = createActivity;
}]);