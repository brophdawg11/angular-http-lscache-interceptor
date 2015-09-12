;(function () {

  // Register lscacheExtra as a module
  if (window.lscache) {
      angular.module('lscacheExtra', [])
             .constant('lscacheExtra', window.lscache);
  } else {
      console.error('ERROR: No lscache module found, did you forget to ' +
                    'include the bower_components/lscache-extra/lscache.js ' +
                    'file?');
  }

  // Register the interceptor
  angular.module('http-lscache-interceptor', [ 'lscacheExtra' ])
         .constant('pendingRequests', {})
         .factory('http-lscache-interceptor',
                  [ '$q',
                    '$log',
                    'lscacheExtra',
                    'pendingRequests',
                    httpLscacheInterceptor ]);

  function httpLscacheInterceptor($q, $log, lscacheExtra, pendingRequests) {

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
          } else if (cacheKey in pendingRequests) {
            // This exact same request has already been sent, so avoid sending
            // a dup request and set up to listen for that response
            config.lscacheExtra.pending = true;
            dfd = $q.defer();
            dfd.resolve();
            config.timeout = dfd.promise;
          } else {
            // We're about to launch this request, indicate that in
            // pendingRequests
            pendingRequests[cacheKey] = [];
          }
        }

        return config;
      },

      response: function (response) {
        var ttl,
            cacheKey,
            lsConfig = response.config.lscacheExtra;

        if (lsConfig) {
          // Adjust the expiry unit if requested
          if (lsConfig.ttlUnitMs) {
            lscacheExtra.setExpiryUnitMs(lsConfig.ttlUnitMs);
          }

          cacheKey = getCacheKey(response.config);

          // Default 10 unit expiration
          ttl = lsConfig.ttl || 10;

          // Cache result
          lscacheExtra.set(cacheKey, response.data, ttl);

          if (cacheKey in pendingRequests) {
            while (pendingRequests[cacheKey].length > 0) {
              pendingRequests[cacheKey].shift().resolve(response);
            }
            delete pendingRequests[cacheKey];
          }
        }

        return response;
      },

      responseError: function (rejection) {
        var dfd, cachedData, cacheKey;

        if (rejection.config && rejection.config.lscacheExtra) {
          cacheKey = getCacheKey(rejection.config);

          if (rejection.config.lscacheExtra.pending) {
            // This request was marked as pending because threre is already
            // an identical request on the wire.  We want to jut wait for that
            // request to return
            delete rejection.config.lscacheExtra.pending;
            dfd = $q.defer();
            pendingRequests[cacheKey].push(dfd);
            return dfd.promise;

          } else {

            cachedData = rejection.config.lscacheExtra.cachedData;

            if (!cachedData) {
              // We failed for another reason, and did not have valid cached data.
              // Look for expired cache data as a last resort
              cachedData = lscacheExtra.get(cacheKey, true, true);

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
        }

        return $q.reject(rejection);
      }
    };
  }

})();
