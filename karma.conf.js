module.exports = function(config){
  config.set({

    basePath : './',

    files: [
      'bower/angular/angular.js',
      'bower/angular-mocks/angular-mocks.js',
      'src/*.js',
      'test/app.js',
      'test/karma-spec.js'
    ],

    frameworks: [ 'jasmine' ],

    browsers : [ 'PhantomJS' ],

    plugins : [
      'karma-phantomjs-launcher',
      'karma-jasmine',
      'karma-spec-reporter'
    ],

    reporters: [ 'spec' ],

    specReporter: {
      maxLogLines: 5
    }
  });
};
