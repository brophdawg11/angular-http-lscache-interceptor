;(function () {

  var app = window.angular.module('app', [ 'http-lscache-interceptor' ]);

  app.controller('ctrl', [ '$scope', '$timeout', 'keySvc', function ($scope, $timeout, keySvc) {
    function success(d) {
      $scope.data = JSON.stringify(d);
    }

    function err(e) {
      $scope.data = 'ERROR';
      console.error(e);
    }

    $scope.data = 'Loading...';
    keySvc.get().then(success, err);

    $timeout(function () {
      $scope.data = 'Loading again...';
      keySvc.get().then(success, err);
    }, 2000);
  }]);

  app.service('keySvc', [ '$http', '$q', function ($http, $q) {
    this.get = function () {
      return $q(function (resolve, reject) {
        function success1(d) {
          console.log('request 1 cb');
          resolve(d.data);
        }

        function success2(d) {
          console.log('request 2 cb');
          resolve(d.data);
        }

        function success3(d) {
          console.log('request 3 cb');
          resolve(d.data);
        }

        function err(e) {
          reject(e);
        }

        var config = {
          params: {
            param1: 'value1'
          },
          data: {
            data1: 'value1'
          },
          lscacheExtra: {
            ttlUnitMs: 1000, // Set units to seconds
            ttl: 10,         // 10 Units
          }
        };

        $http.get('/demo/data.json', config)
             .then(success1, err);

        $http.get('/demo/data.json', config)
             .then(success2, err);

        $http.get('/demo/data.json', config)
             .then(success3, err);
      });
    };

  }]);

  // Register the interceptor
  app.config([ '$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push('http-lscache-interceptor');
  }]);

})();
