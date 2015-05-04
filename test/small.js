/* jshint node:true */
/* global describe */
"use strict";

var jsc = require("../lib/jsverify.js");

describe("small", function () {
  jsc.property("high complexity algorithm property, 1", "small (array nat)", function (arr) {
    return Array.isArray(arr);
  });

  jsc.property("high complexity algorithm property, 2", "(small array) nat", function (arr) {
    return Array.isArray(arr);
  });
});
