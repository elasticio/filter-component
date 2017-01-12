/*eslint func-names: 0*/
module.exports = function configure(grunt) {

  grunt.initConfig({
    jasmine_node: {
      options: {
        forceExit: true,
        match: '.',
        matchall: false,
        extensions: 'js',
        specNameMatcher: 'spec'
      },
      all: ['spec/']
    }
  });

  grunt.loadNpmTasks('grunt-jasmine-node');

  grunt.registerTask('default', 'jasmine_node');

};
