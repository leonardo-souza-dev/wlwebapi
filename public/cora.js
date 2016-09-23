// public/core.js
var wlwebapifront = angular.module('wlwebapifront', []);
var hash = 'wlwebapifront';

function c(title, text) {
    console.log(title);
    console.log(text);
    console.log('');
}

function mainController($scope, $http) {
    $scope.formData = {};

    // when landing on the page, get all todos and show them
    $http.post('/api/obterfilmesrecomendados', { hash: hash})
        .success(function(data) {
            $scope.filmesrecomendados = data.object.filmesrecomendados;
            console.log('data.object.filmesrecomendados');
            console.log(data.object.filmesrecomendados);
        })
        .error(function(data) {
            console.log('Error: ');
            console.log(data);
        });

    $scope.createMovie = function() {
        $http.post('/api/createmovie', $scope.formData)
            .success(function(data) {
                $scope.formData = {}; // clear the form so our user is ready to enter another
                $scope.filmesrecomendados.push(data.object.filmeCriado);
                console.log(data.object.filmeCriado);
            })
            .error(function(erro) {
                console.log(erro);
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