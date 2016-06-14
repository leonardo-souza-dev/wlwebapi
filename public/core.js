// public/core.js
var scotchTodo = angular.module('scotchTodo', []);

function c(title, text) {
    console.log(title);
    console.log(text);
    console.log('');
}

function mainController($scope, $http) {
    $scope.formData = {};

    // when landing on the page, get all todos and show them
    $http.get('/api/todos')
        .success(function(data) {
            $scope.todos = data;
            console.log(data);
        })
        .error(function(data) {
            console.log('Error: ' + data);
        });

    $scope.setupApp = function() {
        $http.get('/api/setup')
            .success(function(setupresult) {
                $scope.formData = {}; // clear the form so our user is ready to enter another
                 $scope.setupresult = setupresult;
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };

    $scope.searchMovie = function() {
        $http.post('/api/search', $scope.formData)
            .success(function(data) {
                $scope.formData = {}; // clear the form so our user is ready to enter another
                $scope.searchresult = data;
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };

    // when submitting the add form, send the text to the node API
    $scope.createMovie = function() {
        $http.post('/api/todos', $scope.formData)
            .success(function(data) {
                $scope.formData = {}; // clear the form so our user is ready to enter another
                $scope.todos = data;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };

    // delete a todo after checking it
    $scope.deleteMovie = function(id) {
        $http.delete('/api/todos/' + id)
            .success(function(data) {
                $scope.todos = data;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };
}