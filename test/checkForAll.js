/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../lib/jsverify.js");
var assert = require("assert");

describe("checkForall function", function () {

  it("returns true if property holds", function () {
    var result = jsc.checkForall(jsc.integer(), function (/* i */) {
      return true;
    });
    assert(result);
  });

  it("returns false if property does not hold", function () {
    var result = jsc.checkForall(jsc.nat(), function (/* n */) {
      return false;
    });

    assert(result !== true);
  });
});
