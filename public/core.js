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
    $http.get('/api/obterfilmesrecomendados')
        .success(function(data) {
            $scope.filmesrecomendados = data;
            console.log(data);
        })
        .error(function(data) {
            console.log('Error: ' + data);
        });

    $scope.createUserOld = function() {
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

    $scope.searchMovie = function(token) {
        console.log('$scope.formData.searchterm');
        console.log($scope.formData.searchterm);
        console.log('token');
        console.log(token);

        var myReq = { term: $scope.formData.searchterm, token: usercreated.object.token };

        $http.post('/api/search', $scope.formData)
            .success(function(data) {
                console.log('data');
                console.log(data);
                $scope.formData = {}; // clear the form so our user is ready to enter another
                $scope.searchresult = data.object.movies;
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

    // delete a todo after checking it
    $scope.updateuser = function(id) {
        $http.post('/api/updateuser/' + $scope.formData)
            .success(function(data) {
                $scope.todos = data;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };

    $scope.createUser = function() {
        $http.post('/api/createuser')
            .success(function(data) {
                console.log(data);
                $scope.formData = {}; // clear the form so our user is ready to enter another
                $scope.usercreated = data;
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };
}