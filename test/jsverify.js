/* jshint node:true */
/* global describe, it:true */
"use strict";

var jsc = require("../lib/jsverify.js");
var assert = require("assert");

describe("jsverify", function () {
  describe("property", function () {
    jsc.property("+0 === -0", function () {
      return +0 === -0;
    });

    it("fail case", function () {
      var origIt = it;
      it = function (name, p) {
        assert.throws(p);
      };

      jsc.property("0 === 1", function () {
        /* eslint-disable */
        return 0 === 1;
        /* eslint-enable */
      });

      it = origIt;
    });

    jsc.property("takes options", { size: 100, rngState: "000123456789abcdfe" }, jsc.nat(), function (n) {
      return n < 100;
    });

  });
});
