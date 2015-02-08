;(function () {

  var module = window.angular.module('http-lscache-interceptor', []);

  module.factory('http-lscache-interceptor', [ '$q', '$log', function ($q, $log) {

    var lscacheExtra = window.lscacheExtra;

    if (!lscacheExtra) {
      $log.error('http-cache-interceptor exiting because ' +
                 'window.lscacheExtra is undefined');
      return {};
    }

    function getCacheKey(config) {
      var cacheKey;

      if (config.lscacheExtra.key) {
        return config.lscacheExtra.key;
      }

      // Generate key from URL, method, params, and data if not specified
      cacheKey = config.url + '-' + config.method;

      function appendObjValues(obj) {
        if (!obj) { return; }
        for (var k in obj) {
          cacheKey += '-' + k + '=' + obj[k];
        }
      }

      appendObjValues(config.params);
      appendObjValues(config.data);

      return cacheKey;
    }

    function generateResponse(data, config, status, statusText) {
      return {
        data: data || {},
        config: config || {},
        status: status || 200,
        statusText: statusText || "OK"
      };
    }

    return {
      request: function (config) {
        var cacheKey, value, dfd;

        if (config.lscacheExtra) {
          // Build default key from URL if not specified
          cacheKey = getCacheKey(config);

          // Check for a cached value
          value = lscacheExtra.get(cacheKey, true);

          if (value) {
            // Store the value data, and cause the request to abort, which
            // will send us into responseError
            config.lscacheExtra.cachedData = value;
            dfd = $q.defer();
            dfd.resolve();
            config.timeout = dfd.promise;
          }
        }

        return config;
      },

      response: function (response) {
        var ttl,
            lsConfig = response.config.lscacheExtra;

        if (lsConfig) {
          // Adjust the expiry unit if requested
          if (lsConfig.ttlUnitMs) {
            lscacheExtra.setExpiryUnitMs(lsConfig.ttlUnitMs);
          }

          // Default 10 unit expiration
          ttl = lsConfig.ttl || 10;

          // Cache result
          lscacheExtra.set(getCacheKey(response.config), response.data, ttl);
        }

        return response;
      },

      responseError: function (rejection) {
        var dfd,
            cachedData = rejection.config &&
                         rejection.config.lscacheExtra &&
                         rejection.config.lscacheExtra.cachedData;

        if (!cachedData) {
          // We failed for another reason, and did not have valid cached data.
          // Look for expired cache data as a last resort
          cachedData = lscacheExtra.get(getCacheKey(rejection.config), true, true);

          if (cachedData) {
            rejection.config.lscacheExtra.resultWasExpired = true;
          }
        }

        // If available, use the cachedData we looked up in request(), which
        // caused us to abort the request
        if (cachedData) {
          // Clean up after ourselves
          delete rejection.config.lscacheExtra.cachedData;
          rejection.config.lscacheExtra.resultWasCached = true;
          dfd = $q.defer();
          dfd.resolve(generateResponse(cachedData, rejection.config));
          return dfd.promise;
        }

        return $q.reject(rejection);
      }
    };
  }]);

})();
