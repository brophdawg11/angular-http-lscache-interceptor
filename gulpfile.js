var args = require('yargs').argv,
    gulp = require('gulp');

// Clean then build
gulp.task('build', function (cb) {
  var runSequence = require('run-sequence');
  runSequence('clean',
              'minify',
              'test',
              'bump-version',
              cb);
});

/**
 * Run test once and exit
 */
gulp.task('test', function (cb) {
  var runSequence = require('run-sequence');
  runSequence('test:karma', cb);
});

gulp.task('test:karma', function (done) {
  var karma = require('karma').server,
      opts = {
        configFile: __dirname + '/karma.conf.js',
        singleRun: true,
      };

  karma.start(opts, done);
});

gulp.task('minify', function () {
  var uglify = require('gulp-uglifyjs');
  return gulp.src('src/angular-http-lscache-interceptor.js')
      .pipe(uglify('angular-http-lscache-interceptor.min.js'))
      .pipe(gulp.dest('dist'));
});

gulp.task('jshint', function() {
  var jshint = require('gulp-jshint');
  return gulp.src('src/*.js')
             .pipe(jshint())
             .pipe(jshint.reporter('default'));
});

gulp.task('bump-version', function (cb) {
  var gulp = require('gulp'),
      git = require('gulp-git'),
      bump = require('gulp-bump'),
      filter = require('gulp-filter'),
      tag_version = require('gulp-tag-version');

  /**
   * Bumping version number and tagging the repository with it.
   * Please read http://semver.org/
   *
   * You can use the commands
   *
   *     gulp patch     # makes v0.1.0 → v0.1.1
   *     gulp feature   # makes v0.1.1 → v0.2.0
   *     gulp release   # makes v0.2.1 → v1.0.0
   *
   * To bump the version numbers accordingly after you did a patch,
   * introduced a feature or made a backwards-incompatible release.
   */

  var importance = args.major ?
                    'major' :
                     args.minor ?
                       'minor':
                       'patch';

  // get all the files to bump version in
  return gulp.src(['./package.json', './bower.json'])
        // bump the version number in those files
        .pipe(bump({type: importance}))
        // save it back to filesystem
        .pipe(gulp.dest('./'))
        // commit the changed version number
        .pipe(git.commit('bumped package version'))
        // read only one file to get the version number
        .pipe(filter('package.json'))
        // **tag it in the repository**
        .pipe(tag_version());
});

// Remove build artifacts
gulp.task('clean', function () {
    var clean = require('gulp-clean');
    return gulp.src(['dist'], {read: false})
               .pipe(clean());
});
