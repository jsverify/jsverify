module.exports = function (config) {
  "use strict";
  config.set({
    basePath: "",
    frameworks: ["mocha"],
    files: [
      "tests-bundle.js"
    ],
    exclude: [
    ],
    preprocessors: {
    },
    reporters: ["progress"],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ["Chrome", "Firefox"],
    singleRun: true
  });
};
