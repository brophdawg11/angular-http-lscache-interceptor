;(function () {

  angular.module('app', [ 'http-lscache-interceptor' ])
         .config([ '$httpProvider', config ])
         .controller('ctrl', [ '$scope', '$timeout', 'svc', _ctrl ])
         .service('svc', [ '$http', '$q', _svc ]);

  function config($httpProvider) {
    $httpProvider.interceptors.push('http-lscache-interceptor');
  }

  function _ctrl($scope, $timeout, svc) {
    $scope.results = [];
    $scope.fetchData = fetchData;

    function fetchData () {
      svc.get().then(success, err);

      function success(d) {
        $scope.results.push(JSON.stringify(d));
      }

      function err(e) {
        $scope.results.push('ERROR');
        console.error(e);
      }
    }
  }

  function _svc($http, $q) {
    this.get = function () {
      var dfd = $q.defer(),
          httpConfig = {
            lscacheExtra: {
              ttlUnitMs: 1000, // Set units to seconds
              ttl: 5           // 10 Units
            }
          };

      function success(d) {
          d.data.cached = d.config.lscacheExtra != null &&
                          d.config.lscacheExtra.resultWasCached === true;
          dfd.resolve(d.data);
      }

      $http.get('/demo/data.json', httpConfig)
           .then(success, dfd.reject);

      return dfd.promise;
    };
  }
})();
