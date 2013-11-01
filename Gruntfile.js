/* jshint node: true */
"use strict";

module.exports = function(grunt) {
	// Project configuration.
	grunt.initConfig({
		jasmine: {
			jsverify: {
				src: "lib/**/*.js",
				options: {
					specs: "spec/jsverify/*Spec.js",
					helpers: "helpers/*.js"
				},
			},
			q: {
				src: [ "lib/**/*.js", "dep/q.js" ],
				options: {
					specs: "spec/q/*Spec.js",
					helpers: "helpers/*.js"
				},
			},
			underscore: {
				src: [ "lib/**/*.js", "dep/underscore.js" ],
				options: {
					specs: "spec/underscore/*Spec.js",
					helpers: "helpers/*.js"
				},
			},
			lodash: {
				src: [ "lib/**/*.js", "dep/lodash.underscore.js" ],
				options: {
					specs: "spec/underscore/*Spec.js",
					helpers: "helpers/*.js"
				},
			},
			all: {
				src: [ "lib/**/*.js", "dep/underscore.js", "dep/q.js" ],
				options: {
					specs: "spec/**/*Spec.js",
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
			}
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
	grunt.loadNpmTasks("grunt-literate");

	// Default task.
	grunt.registerTask("default", ["jshint"]);
	grunt.registerTask("test", ["jshint", "jasmine:all", "jasmine:lodash"]);
	grunt.registerTask("jasmine-build", ["jasmine:all:build"]);
};
