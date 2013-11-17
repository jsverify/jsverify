/* jshint node: true */
"use strict";

module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        simplemocha: {
            options: {
                timeout: 3000,
                ui: "bdd",
                reporter: "spec"
            },

            all: { src: "test/**/*.js" }
        },
        jasmine: {
            jsverify: {
                src: "dist/jsverify.standalone.js",
                options: {
                    specs: "spec/*.js",
                    helpers: "helpers/*.js"
                },
            },
        },
        jshint: {
            options: {
                jshintrc: ".jshintrc"
            },
            gruntfile: {
                src: "Gruntfile.js",
                options: {
                    node: true,
                },
            },
            lib: {
                src: ["lib/**/*.js"]
            },
            spec: {
                src: ["spec/**/*.js"]
            },
            test: {
                src: ["test/**/*.js"],
            },
        },
        watch: {
            gruntfile: {
                files: "<%= jshint.gruntfile.src %>",
                tasks: ["jshint:gruntfile"]
            },
            lib: {
                files: "<%= jshint.lib.src %>",
                tasks: ["jshint:lib"]
            },
        },
        literate: {
            "README.md": "lib/jsverify.js",
        },
    });

    // Tasks
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-jasmine");
    grunt.loadNpmTasks("grunt-simple-mocha");
    grunt.loadNpmTasks("grunt-literate");

    // Default task.
    grunt.registerTask("default", ["jshint"]);
    grunt.registerTask("test", ["jshint", "simplemocha", "jasmine"]);
    grunt.registerTask("jasmine-build", ["jasmine:jsverify:build"]);
};
