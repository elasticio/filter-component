module.exports = function init(grunt) {
  // Add the grunt-mocha-test tasks.
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.initConfig({
    // Configure a mochaTest task
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          quiet: false, // Optionally suppress output to standard out (defaults to false)
          clearRequireCache: false, // Optionally clear the require cache before running tests
          noFail: false, // Optionally set to not fail on failed tests
        },
        src: ['test/**/*.js'],
      },
    },
  });

  grunt.registerTask('default', 'mochaTest');
};
