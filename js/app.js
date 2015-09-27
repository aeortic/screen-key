// script.js

// create the module and name it etaApp
var etaApp = angular.module('etaApp', ['ui.router', 'ui.bootstrap', 'scenario', 'navigation', 'events']);

// configure our routes
etaApp.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/login');

    $stateProvider

    // LOGIN STATE
        .state('login', {
            url: '/login',
            templateUrl: 'pages/login.html',
            controller: 'loginController'
        })

    // HOME STATE
        .state('home', {
            url: '/home',
            templateUrl: 'pages/home.html',
            controller: 'homeController'
        })

    // PENDING ACTIVITIES STATE
        .state('pendingActivities', {
            url: '/pendingActivities',
            templateUrl: 'pages/pendingActivities.html',
            controller: 'pendingActivitiesScreenController'
        })

    // START ACTIVITY STATE
        .state('startActivity', {
            url: '/startActivity',
            templateUrl: 'pages/startActivity.html',
            controller: 'startActivityScreenController'
        })

    // ACTIVITY DETAIL STATE
        .state('activityDetails', {
            url: '/activityDetails',
            templateUrl: 'pages/activityDetails.html',
            controller: 'activityDetailsController'
        })

    // CREATE SRO STATE
        .state('createSRO', {
            url: '/createSRO',
            templateUrl: 'pages/activityDetails/createSRO.html',
            controller: function($scope) {
                $scope.message = "Activity Details - Create SRO";
            }
        })

    // HOUSE STATE
        .state('house', {
            url: '/house',
            templateUrl: 'pages/activityDetails/house.html',
            controller: function($scope) {
                $scope.message = "Activity Details - House";
            }
        })

    // ADMIN STATE
        .state('admin', {
            url: '/admin',
            templateUrl: 'pages/admin.html',
            controller: 'adminCtrl'
        })

});

etaApp.factory('getNewActivity', function() {

    var cap = function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }


    return function () {

        var activity = {
            "status": "Suspended",
            "activityType": "",
            "workOrder": "",
            "accountNumber": "",
            "firstName": "Darrio",
            "lastName": "Fearing",
            "address": "425 Mainsail Ct",
            "city": "Lake Mary",
            "zip": "327466034",
            "phone": "555760757324",
            "timeSlot": "13-15",
            "start": "17:15",
            "end": "17:44",
            "problemCode": "23 PPV Problem",
            "workOrderType": "TC",
            "workOrderClass": "C"
        };

        activity.workOrder = Math.floor( Math.random() * 900000000 ) + 100000000;
        activity.accountNumber = Math.floor( Math.random() * 900000000 ) + 100000000;
        activity.activityType = cap(faker.hacker.verb()) + " " + cap(faker.hacker.adjective()) + " " + cap(faker.hacker.noun());
        activity.firstName = faker.name.firstName();
        activity.lastName = faker.name.lastName();
        activity.address = faker.address.streetAddress();
        activity.city = faker.address.city();
        activity.phone = faker.phone.phoneNumber();
        activity.zip = faker.address.zipCode().replace('-', '');
        activity.problemCode = faker.random.number() + " " + faker.commerce.productName();

        return activity };
});


// create the controller and inject Angular's $scope
etaApp.controller('mainController', [
    '$scope',
    '$http',
    '$log',
    'getNewActivity',
    function($scope, $http, $log, getNewActivity) {

	// create a message to display in our view
	$scope.title = 'ETA Direct Screen Key';
    $scope.workOrder = 'default';

    $scope.$on('setActivity', function(event, parameters) {
        $scope.workOrder = parameters.workOrder;
    });

    $scope.$on('createActivity', function(event, parameters) {

        var newActivity = getNewActivity();

        if (parameters.position == "top") {
            $scope.userData.activities.unshift(newActivity);
        } else if (parameters.position == "bottom") {
            $scope.userData.activities.push(newActivity);
        }

    });

    $scope.$on('deleteActivity', function(event, parameters) {

        angular.forEach($scope.userData.activities, function(value,key) {
            if (value.workOrder == parameters.workOrder) {
                $scope.userData.activities.splice(key, 1);
            }
        });

    });

    // I feel that tracking a given value should be separated from the logic handling activities, as the tracking
    // of values seems like a more general task than the management of the activity life-cycle. As such,
    // I would probably refactor this to be at a higher level of the scope.
    $scope.$on('trackValue', function(event, parameters) {
        $scope[parameters.key] = parameters.value;
    })

    $http.get('data/user.json')
        .then(function(resource){
            $scope.userData = resource.data;
        });

}]);

etaApp.controller('loginController', function($scope) {
    $scope.message = 'Login';
});

etaApp.factory('showActivity', function( $rootScope) {

    return function(id) {
        dispatch('setActivity', {workOrder:id});
    };
});

etaApp.factory('deleteActivity', function( $rootScope) {

    return function(id) {
        dispatch('deleteActivity', {workOrder:id});
    };
});

etaApp.factory('createActivity', function( $rootScope) {

    return function(pos) {
        dispatch('createActivity', {position:pos});
    };
});

etaApp.factory('filterArray', function() {

    return function(searchNodeName, searchTerm, searchArray) {
            var filteredList = [];
            for (var i = 0,
                     activities = searchArray,
                     term = searchTerm,
                     nodeName = searchNodeName
                ; i < activities.length; i++) {
                if (activities[i][nodeName] === term) {
                    filteredList.push(activities[i]);
                }
            }
            return filteredList;
    };
});

etaApp.factory('statusArray', function() {
    return [
        {statusFilter:"Started", headerLabel:"Started"},
        {statusFilter:"Suspended", headerLabel:"Pending"},
        {statusFilter:"Completed", headerLabel:"Closed"}
    ];
});

etaApp.factory('getStatusByLabel', ['statusArray', function(statusArray) {
    return function(label) {
        var found;
        angular.forEach(statusArray, function(value,key) {
            if (value.headerLabel == label) {
                found = value;
            }
        });

        return found;
    }
}]);

etaApp.controller('statusesCtrl', ['$scope', '$log', 'statusArray', function($scope, $log, statusArray){
    $scope.statusArray = statusArray;

    $scope.setNext = function(status) {
        $scope.status = status;
        //$scope.statuses.unshift();
    }
}]);

etaApp.controller('activityStatusListCtrl', ['$scope', '$log', 'filterArray', 'showActivity', function($scope, $log, filterArray, showActivity) {

    $scope.showActivity = showActivity;

    $scope.filteredList = filterArray("status", $scope.status.statusFilter, $scope.userData.activities);

    $scope.headerVisible = ($scope.filteredList.length > 1 || ( $scope.status.headerLabel == 'Closed' && $scope.filteredList.length != 1 ));
    $scope.activityVisible = ($scope.status.headerLabel != 'Closed' || $scope.filteredList.length == 1);
    if ($scope.headerVisible == false)
    {
        // Basically, if the header is not showing, then that means that any activities that are showing need to be
        // treated as though they were the header.
        $scope.isHeader = "header";
    } else {
        $scope.isHeader = "notHeader";
    }
}]);

etaApp.controller('homeController', ['$scope', function($scope) {

	// create a message to display in our view
	$scope.message = 'Home';


}]);

etaApp.controller('startActivityScreenController', ['$scope', function($scope) {

	// create a message to display in our view
	$scope.message = 'Start Activity';


}]);

etaApp.controller('pendingActivitiesScreenController', ['$scope', '$log', 'getStatusByLabel', function($scope, $log, getStatusByLabel) {
    $scope.message = 'Pending Activities';

    // This would probably be better if the statuses were an array set in the scope at a point accessible to all the
    // controllers. I think I can do that by defining a factory...
    $scope.status = getStatusByLabel('Pending');

}]);


etaApp.controller('activityDetailsController', ['$scope', '$log', 'filterArray', function($scope, $log, filterArray) {
    $scope.message = 'Activity Details';
    var activity = {};
    // here is code to find the activity we want to use for the display...
    if ($scope.workOrder === "default") {
        activity = $scope.userData.activities[0];
    } else {
        var filteredList = filterArray("workOrder", $scope.workOrder, $scope.userData.activities);

        if (filteredList.length == 1)
        {
            activity = filteredList[0];
        }


        if (activity === {}) {
            $log.log("Error finding the work order. Somehow the provided work order doesn't exist.");
            $log.log("Work Order: "+$scope.workOrder);
            activity = $scope.userData.activities[0];

        }
    }

    activity.fullName =  activity.firstName + " " + activity.lastName;
    activity.time = activity.start + " - " + activity.end;
    $scope.activity = activity;

}]);
