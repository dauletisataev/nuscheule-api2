var app = angular.module('app', []);
app.controller('main', ['$scope', '$http', '$window', function($scope, $http, $window) {
    console.log("Hello World from controller");

    $scope.submit = function() {
        var input = document.getElementById('file'),
        file = input.files[0];


        $http.get('/oAuthUrl').then(function(response){
           console.log(response.data);
           $window.location.href= response.data//, "Вход", "width=500, height=500");
        });
        /*$http.post('/', {fileinput: file}).then(function(response){
            console.log(response.data);
        });*/
    };
    $scope.fileSubmit = function(){ //function to call on form submit
           // if ($scope.file) { //check if from is valid
                $scope.upload($scope.file); //call upload function
           // }
    }; 


}]);

app.controller('schedule', ['$scope', '$http', '$window', function($scope, $http, $window) { 
    console.log("Started working......."); 
    $http.get('/getSchedule/201599251').then(function(response){
       console.log(response.data);
       $scope.subjects = response.data;
       console.log(response.data);
    });
}]);