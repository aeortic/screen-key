/**
 *
 * Created by n0232321 on 9/21/2015.
 */

var scenario = angular.module('scenario', ['events']);

// this needs to get put onto the index page somewhere.
scenario.controller('scenarioCtrl', ['$scope', '$http', '$log', 'scenarioData', 'commander', 'validate', function($scope, $http, $log, data, commander, validate) {

    $http.get('data/scenario.json')
        .then(function(resource){
            var scenarioData = resource.data;

            angular.forEach(scenarioData.steps, function(value,key) {
                if (value.name == undefined || value.name == "") {
                    value.name = "step "+key;
                }
            });
            data.init(scenarioData);
            $scope.scenarioData = scenarioData;
            commander.run();
        });

    // I get a code smell from this listener being in the scenarioCtrl, but I haven't yet decided on a better
    // place for it. Another weird thing enabled by this code block are multiple validation checks, due to both
    // 'playBtn' and 'validationFail' messages being handled in the highlight directive. I feel there must be a more
    // efficient way of doing this.
    $scope.$on('playBtn', function() {
        if (!validate.checkScope($scope))
        {
            // fail
            validate.fail();
        } else {
            // pass
            validate.pass();
        }

    });
}]);

scenario.controller('stepCtrl', ['$scope', '$log', 'scenarioData', function($scope, $log, data){
   $scope.checkIndex = function(index) {
       if (index == data.getIndex()) {
           $scope.activeStep = true;
           return "activeStep";
       }
   }
}]);


scenario.factory('scenarioData', function() {
   var inner,
       index,
       data = {
           init: function (item) {
               inner = item.steps;
           },
           getIndex: function() {
               return index;
           },
           get: function () {
               return inner[index];
           },
           next: function () {
               if (index == undefined) {
                   index = 0;
                   return this.get();
               }else if (index != inner.length - 1) {
                   index++;
                   return this.get();
               }
           }
       };

    return data;
});



scenario.factory('commander', ['$log', 'scenarioData', 'highlightManager', function($log, data, highlights) {
    var commander = {
        run: function() {
            var step = data.next();

            if (step != undefined && step.commands != undefined) {

                for (var i= 0, commands = step.commands, length = commands.length; i<length; i++) {
                    // I'll need to account for trigger commands later on. I might just pull the code used in FNOL
                    switch (commands[i].type) {
                        case "decorate":
                            highlights.add(commands[i].id);
                            break;
                        case "mollify":
                            highlights.remove(commands[i].id);
                            break;
                    }
                }
            }
        }
    };

    return commander;
}]);

/**
 * This service will maintain a list of items that should have a highlight. It will also determine if that
 * is a green state or a red state. The green state will take the form of the string "highlight", the red state
 * will take the form of the string "warn". So, an element can have three states. No highlight if missing from
 * the list entirely, a green highlight, or a red highlight. It should be noted that the red and green highlight
 * are mutually exclusive, and that each element can only possess one state at a time.
 */
scenario.factory('highlightManager', function($log) {

    var ids = {},
        greenState = "highlight",
        redState = "warn",

    // I need to refactor this so that I can accommodate different decoration states.
    manager = {
        decoratorList: [greenState, redState],
        add: function (id, changeState) {
            // we will assume the green state if none is explicitly defined.
            changeState = changeState?changeState:greenState;
            // check to see if the id is on the list, and add it if not.

            ids[id] = {state: changeState};

        },
        fail: function(id) {
            this.add(id, redState);
        },
        remove: function (id) {
            // check to see if the id is on the list, and remove it if so.
           delete ids[id];
        },
        // This needs to return the decorator state that has been stored for the given id.
        check: function (id) {

            if (ids[id] != undefined) {
                return ids[id].state;
            }

        }
    };

    return manager;
});

scenario.factory('validate', ['scenarioData', 'commander', 'dispatch', 'highlightManager', function(data, commander, dispatch, manager) {
    return {
        checkScope: function(scope)
        {
            var allGood = true;
            angular.forEach(data.get().validations, function (validation) {
                if (validation.value != undefined && scope[validation.id] != validation.value) {
                    manager.fail(validation.id);
                    allGood = false;
                }
            });

            return allGood;
        },
        checkID: function(scope, name)
        {
            var stepValue;
            angular.forEach(data.get().validations, function (validation) {
                if (validation.id == name) {
                    stepValue = validation["value"];
                }
            });

            // If no validation content has been found, we will assume that we are good to go.
            if (stepValue == undefined || stepValue == scope[name]) {
                return true;
            } else {
                manager.fail(name);
                return false;
            }
        },
        pass: function() {
            commander.run();
        },
        fail: function() {
            dispatch('validationFail')
        }

    }

}]);

scenario.factory("setTrackingBehavior", ['$log', 'dispatch', 'validate', 'highlightManager', function($log, dispatch, validate, manager){
    return function(scope, element, name, message) {
        var type = element[0].nodeName;

        if (type == "BUTTON") {
            scope.clickingCallback = function(event) {

                // I have not used this line very often thus far, but it does seem like a more general
                // task that could be refactored to have a dedicated method. The syntax could be
                //     trackValue(key, message);
                // or something along those lines.
                dispatch('trackValue', {key:name, value:message});

                // We need to look up the value of the button stored in the scope and see if it lines up with the
                // expected value for this step of the scenario.
                if (!validate.checkID(scope, name)){
                    event.preventDefault();
                    validate.fail();
                } else {
                    // I want the button click to immediately move to the next step if the validation is
                    // successful. But I also felt that it was a bit too tightly tangled to have the validate
                    // service assume that this is the case. By having a separate function, I can allow any
                    // calling code to take any necessary actions before continuing. That is not needed in this
                    // case (yet), but this tactic seems to better fit encapsulation principles.
                    validate.pass();
                }

            };
            element.bind('click', scope.clickingCallback);
        }
    }
}]);

scenario.directive("highlight", ['$log', 'highlightManager', 'setTrackingBehavior', function($log, manager, setBehavior) {

     var decorator;
    var checkID = function(id, element) {
        decorator = manager.check(id);
        $log.log(decorator);
        if (decorator != undefined) {
            element.addClass(decorator);
        } else {
            angular.forEach(manager.decoratorList, function(value) {
                element.removeClass(value);
            });

        }
    };

    return {
        restrict: "A",
        link: function(scope, element, attrs, controller) {
            var id = attrs.id;
            // here we run some code to determine if the indicated id needs to be highlighted...
            checkID(id, element);

            // the name of this event is not in keeping with it's function. This should probably be refactored.
            scope.$on('playBtn', function() {
                checkID(id, element);
            });

            scope.$on('validationFail', function() {
                checkID(id, element);
            });

            // Here we set some behaviors. The element's tag determines the behavior.
            // Note that we will use the id of the element as the key and the passed parameter as
            // the value. This will help us later with validation.
            setBehavior(scope, element, attrs.id, attrs["highlight"]);
        }
    }
}]);