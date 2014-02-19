/* jshint -W097 */
/* jshint node:true */

'use strict';

var request = require('request');

module.exports = function(grunt) {
    // show elapsed time at the end
    require('time-grunt')(grunt);
    // load all grunt tasks
    require('load-grunt-tasks')(grunt, {
        pattern: ['grunt-*', '!grunt-template-jasmine-istanbul']
    });

    var reloadPort = 35729,
        files;

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        jshint: {
            files: [
                'Gruntfile.js',
                'src/**/*.js',
                '!release/**',
                '!node_modules/**/*.js',
                'specs/**/*Spec.js'
            ],
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                boss: true,
                eqnull: true,
                browser: true
            }
        },

        serverTests: {
            files: [
                'config/**/*.js',
            ],
            tasks: ['jasmine_node']
        },


        watch: {
            files: [
                '<%= jshint.files %>',
                'src/**/*.js',
                'specs/**/*.js'
            ],
            tasks: ['jshint', 'jasmine_node'],

            server: {
                files: ['<%= jshint.files %>']
            }
        },

        jasmine_node: {
            src: 'src/**/*.js',
            spacNameMatcher: 'test',
            projectRoot: ".",
            requirejs: false,
            forceExit: true,
            verbose: false,
            jUnit: {
                report: false,
                savePath: "reports/jasmine/",
                useDotNotation: true,
                consolidate: true
            }
        }

    });

    grunt.config.requires('watch.server.files');
    files = grunt.config('watch.server.files');
    files = grunt.file.expand(files);

    grunt.registerTask('delayed-livereload', 'Live reload after the node server has restarted.', function() {
        var done = this.async();
        setTimeout(function() {
            request.get('http://localhost:' + reloadPort + '/changed?files=' + files.join(','), function(err, res) {
                var reloaded = !err && res.statusCode === 200;
                if (reloaded) {
                    grunt.log.ok('Delayed live reload successful.');
                } else {
                    grunt.log.error('Unable to make a delayed live reload.');
                }
                done(reloaded);
            });
        }, 500);
    });

    grunt.loadNpmTasks('grunt-jasmine-node');
    grunt.loadNpmTasks('grunt-notify');

    grunt.registerTask('default', 'jasmine_node');
};