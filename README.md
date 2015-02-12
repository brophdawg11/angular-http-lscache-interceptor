![Build Status](https://travis-ci.org/brophdawg11/angular-http-lscache-interceptor.svg?branch=master)

# angular-ajax-lscache-interceptor

*angular-http-lscache-interceptor* is an interceptor that caches [$http](https://docs.angularjs.org/api/ng/service/$http) requests, on an opt-in basis, in localStorage using [lscache-extra](https://github.com/brophdawg11/lscache-extra).  It is basically a port of [jquery.ajax.lscache](https://github.com/brophdawg11/jquery.ajax.lscache) for Angular.  Please check out the jquery.ajax.lscache documentation for a more complete description.

#### Installation
`bower install angular-http-lscache-interceptor`

#### Example usage

```javascript
  var app = window.angular.module('app', [ 'http-lscache-interceptor' ]);

  app.service('service', [ '$http', '$q', function ($http, $q) {
    this.get = function () {
        var config = {
          // Specify that we want this to be cached
          lscacheExtra: {
            // Key used in lscache-extra (default will be
            // constructed from the url, data, and params)
            key: 'cache-key',

            // Set units to seconds (default is minutes)
            ttlUnitMs: 1000,

            // Cache for 5 units (Default is 10)
            ttl: 5
          }
        };

        return $http.get('/demo/data.json', config);
      });
    };
  }]);

  // Register the interceptor
  app.config([ '$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push('http-lscache-interceptor');
  }]);

})();

```
