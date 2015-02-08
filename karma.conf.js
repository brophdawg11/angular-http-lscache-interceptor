module.exports = function(config){
  config.set({

    basePath : './',

    files: [
      'bower_components/angular/angular.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'src/*.js',
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
