var app = angular.module('app', [ 'http-lscache-interceptor' ]);

// Register the interceptor
app.config([ '$httpProvider', function($httpProvider) {
  $httpProvider.interceptors.push('http-lscache-interceptor');
}]);


//data store for holding objects
var localStore = {};

//localStorage mock for interacting with localStore
var fakeLocalStorage = {
  getItem: function (key) {
      return localStore[key];
  },
  setItem: function (key, value) {
      localStore[key] = val+'';
  },
  removeItem: function (key) {
      delete localStore[key];
  },
  clear: function() {
      localStore = {};
  }
};

describe('http-lscache-interceptor', function () {

  var $injector,
      $window,
      $http,
      $timeout,
      $httpBackend,
      endpoint = '/sample-endpoint',
      mockData = { key: 'value' };


  beforeEach(module('app'));

  beforeEach(function () {
    $window = {
      localStorage: fakeLocalStorage
    };

    module(function ($provide) {
      $provide.value('$window', $window);
    });
  });

  // Set up $scope and controller before every test
  beforeEach(inject(function (_$injector_) {
    $injector = _$injector_;
    $http = $injector.get('$http');
    $timeout = $injector.get('$timeout');
    $httpBackend = $injector.get('$httpBackend');

    $httpBackend.when('GET', endpoint)
                .respond(mockData);
  }));

  function err(e) {
    expect(false).toBe(true);
  }

  function makeHttpRequest(lsConfig, cb) {
    $httpBackend.expectGET(endpoint);
    $http.get(endpoint, { lscacheExtra: lsConfig }).then(cb, err);
    $httpBackend.flush();
  }

  it('should not be cached on the first request', function () {

    function uncachedSuccess(d) {
      expect(d).toBeDefined();
      expect(d.data).toEqual(mockData);

      // On first pass, we shouldn't have gotten cached data
      expect(d.config.lscacheExtra).toBeDefined();
      expect(d.config.lscacheExtra.resultWasCached).toBeUndefined();
      expect(d.config.lscacheExtra.resultWasExpired).toBeUndefined();
    }

    makeHttpRequest({}, uncachedSuccess);
  });

  // TODO: Figure out how to handle making two separate requests to test
  // caching abilities
});
