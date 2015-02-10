// Mocked lscacheExtra
function mockLscacheExtra(Date) {
  var localStore = {};
  var expiryUnits = 60 * 1000;

  function getExprKey(key) {
    return key + '-expr';
  }

  function get(key) {
    if (localStore[key]) {
      try {
        return JSON.parse(localStore[key]);
      } catch (e) {
        return localStore[key];
      }
    }
    return null;
  }

  return {
    get: function (key) {
      console.log('get', key);
      var val = get(key);
      if (val && get(getExprKey(key)) >= Date.now()) {
        return val;
      }
      return null;
    },
    set: function (key, value, ttl) {
      console.log('set', key, value, ttl);
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      localStore[key] = value + '';
      localStore[getExprKey(key)] = Date.now() + (ttl * expiryUnits);
    },
    remove: function (key) {
      delete localStore[key];
      delete localStore[getExprKey(key)];
    },
    flush: function () {
      localStore = {};
    },
    setExpiryUnitMs: function (ms) {
      expiryUnits = ms;
    }
  };
}

function mockDateObject() {
  var time = Date.now();
  return {
    now: function () {
      return time;
    },
    advance: function (ms) {
      time += ms;
    }
  };
}

describe('http-lscache-interceptor', function () {

  var $injector,
      $http,
      $httpBackend,
      httpProvider,
      mockedDate = mockDateObject(),
      lscacheExtra = mockLscacheExtra(mockedDate),
      endpoint = '/sample-endpoint',
      mockData = { key: 'value' },
      lsConfig;


  beforeEach(function () {
    // Create shell app for the interceptor
    angular.module('app', [ 'http-lscache-interceptor' ])
           .config([ '$httpProvider', function ($httpProvider) {
      $httpProvider.interceptors.push('http-lscache-interceptor');
    }]);

    // Provide mocked lscacheExtra
    module('app', function ($provide, $httpProvider) {
      $provide.constant('lscacheExtra', lscacheExtra);
      httpProvider = $httpProvider;
    });

    // Clear the cache before every test
    lscacheExtra.flush();

    // Watch calls to the mocked cache
    spyOn(lscacheExtra, 'get').and.callThrough();
    spyOn(lscacheExtra, 'set').and.callThrough();
  });

  // Inject test dependencies
  beforeEach(inject(function (_$injector_) {
    $injector = _$injector_;
    $http = $injector.get('$http');
    $httpBackend = $injector.get('$httpBackend');

    // Mock the endpoint
    $httpBackend.when('GET', endpoint)
                .respond(mockData);
  }));

  function err(e) {
    expect(false).toBe(true);
  }

  function makeHttpRequest(cb, flush) {
    console.log('making http request');

    // Make sure this is created fresh each time, otherwise properties will
    // persist across calls
    lsConfig = { key: 'key', ttl: 2, ttlUnitMs: 100 };

    $httpBackend.expectGET(endpoint);
    $http.get(endpoint, { lscacheExtra: lsConfig }).then(cb, err);
    if (flush) { $httpBackend.flush(); }
  }

  function verifyData(d) {
    expect(d).toBeDefined();

    // Make sure we got back the right data
    expect(d.data).toEqual(mockData);

    // Make sure it was passed through the interceptor
    expect(d.config.lscacheExtra).toBeDefined();
  }

  function verifyUncachedResponse(d) {
    verifyData(d);

    // On first pass, we shouldn't have gotten cached data
    expect(d.config.lscacheExtra.resultWasCached).toBeUndefined();
    expect(d.config.lscacheExtra.resultWasExpired).toBeUndefined();

    // Expect that we checked for a cached version with skipRemove=true
    expect(lscacheExtra.get).toHaveBeenCalledWith(lsConfig.key, true);

    // Expect that we cached the resulting data
    expect(lscacheExtra.set).toHaveBeenCalledWith(lsConfig.key, mockData, lsConfig.ttl);
  }

  function verifyCachedResponse(d) {
    verifyData(d);

    // On first pass, we shouldn't have gotten cached data
    expect(d.config.lscacheExtra.resultWasCached).toBe(true);
    expect(d.config.lscacheExtra.resultWasExpired).toBeUndefined();

    // Expect that we checked for a cached version with skipRemove=true
    expect(lscacheExtra.get).toHaveBeenCalledWith(lsConfig.key, true);
  }

  it('should register an interceptor', function () {
    expect(httpProvider.interceptors).toContain('http-lscache-interceptor');
  });

  it('should not be cached on the first request', function () {
    makeHttpRequest(verifyUncachedResponse, true);
  });

  it('should be cached on the second request', function () {

    function uncachedCb(d) {
      verifyUncachedResponse(d);

      // Launch a second call
      makeHttpRequest(cachedCb, false);
    }

    function cachedCb(d) {
      verifyCachedResponse(d);

      // Expect that we checked for a cached version with skipRemove=true
      expect(lscacheExtra.get.calls.count()).toBe(2);

      // Expect that we did not re-cache the data, thus we only have the first call
      expect(lscacheExtra.set.calls.count()).toBe(1);
    }

    makeHttpRequest(uncachedCb, true);
  });

  it('should properly expire the cache', function (done) {

    function uncachedCb(d) {
      console.log('uncachedcb');
      verifyUncachedResponse(d);

      // Launch a second call
      makeHttpRequest(cachedCb, false);
    }

    function cachedCb(d) {
      console.log('cachedcb');
      verifyCachedResponse(d);

      // One get() call per request
      expect(lscacheExtra.get.calls.count()).toBe(2);

      // Expect that we did not re-cache the data, thus we only have the
      // first call
      expect(lscacheExtra.set.calls.count()).toBe(1);

      // Advance the 'current' time far enough to expire the cache to avoid
      // any $timeout silliness
      mockedDate.advance((lsConfig.ttl + 1) * lsConfig.ttlUnitMs);
      makeHttpRequest(expiredCb, false);
    }

    function expiredCb(d) {
      console.log('expiredcb');
      verifyUncachedResponse(d);

      // One get() call per request
      expect(lscacheExtra.get.calls.count()).toBe(3);

      // We should have re-cached the data this time
      expect(lscacheExtra.set.calls.count()).toBe(2);

      done();
    }

    makeHttpRequest(uncachedCb, true);
  });

});
