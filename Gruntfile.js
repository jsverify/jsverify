/* jshint node: true */
'use strict';

module.exports = function(grunt) {
	// Project configuration.
	grunt.initConfig({
		jasmine: {
			jsverify: {
				src: 'lib/**/*.js',
				options: {
					specs: 'spec/jsverify/*Spec.js',
					helpers: 'helpers/*.js'
				},
			},
			q: {
				src: [ 'lib/**/*.js', 'dep/q.js' ],
				options: {
					specs: 'spec/q/*Spec.js',
					helpers: 'helpers/*.js'
				},
			},
			underscore: {
				src: [ 'lib/**/*.js', 'dep/underscore.js' ],
				options: {
					specs: 'spec/underscore/*Spec.js',
					helpers: 'helpers/*.js'
				},
			},
			lodash: {
				src: [ 'lib/**/*.js', 'dep/lodash.underscore.js' ],
				options: {
					specs: 'spec/underscore/*Spec.js',
					helpers: 'helpers/*.js'
				},
			},
		},
		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			gruntfile: {
				src: 'Gruntfile.js',
				options: {
					node: true,
				},
			},
			lib: {
				src: ['lib/**/*.js']
			},
			spec: {
				src: ['spec/**/*.js']
			}
		},
		watch: {
			gruntfile: {
				files: '<%= jshint.gruntfile.src %>',
				tasks: ['jshint:gruntfile']
			},
			lib: {
				files: '<%= jshint.lib.src %>',
				tasks: ['jshint:lib']
			},
		},
	});

	// Tasks
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-jasmine');

	// Default task.
	grunt.registerTask('default', ['jshint']);
	grunt.registerTask('test', ['jshint', 'jasmine']);
	grunt.registerTask('jasmine-build', ['jasmine:jsverify:build']);

	// use esprima to generate README.md from source
	grunt.registerTask("readme", "Generate README.md", function () {
		var src = "./lib/jsverify.js";
		var dest = "README.md";
		var esprima = require("esprima");
		var _ = require("underscore");

		var content = grunt.file.read(src);
		var syntax = esprima.parse(content, { comment: true });
		var comments = syntax.comments;

		function isWhitespace(str) {
				return (/^\s*$/).test(str);
		}

		var mdContent = _.reduce(comments, function (acc, comment) {
			if (comment.type === "Block" && comment.value[0] === "*") {
				// block comment starting with /**
				var value = comment.value.slice(1);
				var lines = value.split(/\n/);
				var first = _.find(lines, function (line) { return !isWhitespace(line); } );
				var indent = first ? /^(\s*)/.exec(first)[1] : "";

				// unindent lines
				lines = _.map(lines, function (line) {
						if (line.indexOf(indent) === 0) {
								return line.replace(indent, "");
						} else if (isWhitespace(line)) {
								return "";
						} else {
								return line;
						}
				});

				return acc + lines.join("\n");

			} else {
				// do nothing with rest
				return acc;
			}
		}, "");

		grunt.file.write(dest, mdContent);
	});
};
