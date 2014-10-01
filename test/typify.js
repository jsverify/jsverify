/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../lib/jsverify.js");
var _ = require("underscore");
var assert = require("assert");

describe("typify", function () {
  describe("primitives", function () {
    it("integer", function () {
      jsc.assert(jsc.forall("integer", function (i) {
        return Math.round(i) === i;
      }));
    });
  });

  describe("compositional", function () {
    it("sort is idempotent", function () {
      jsc.assert(jsc.forall("array integer", function (arr) {
        var sorted= _.sortBy(arr);
        return _.isEqual(_.sortBy(sorted), sorted);
      }));
    });
  });

  describe("erroneous cases", function () {
    it("throws exception when invalid generator specified", function () {
      assert.throws(function () {
        jsc.forall("wedonthavethis", function (i) { return true; });
      });
    });

    it("throws exception when unsupported typify type specified", function () {
      assert.throws(function () {
        jsc.forall("*", function (i) { return true; });
      });
    });
  });
});
