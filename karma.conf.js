module.exports = function(config){
  config.set({

    basePath : './',

    client: {
      captureConsole: false
    },

    files: [
      'bower_components/angular/angular.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/lscache-extra/lscache-extra.js',
      'src/*.js',
      'test/*.js'
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
