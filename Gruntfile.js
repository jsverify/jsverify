/* jshint node: true */
"use strict";

module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        literate: {
            "README.md": "lib/jsverify.js",
        },
    });

    grunt.loadNpmTasks("grunt-literate");

    // Default task.
    grunt.registerTask("default", ["literate"]);
};
