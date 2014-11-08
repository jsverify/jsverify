/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../lib/jsverify.js");
var _ = require("underscore");
var assert = require("assert");

describe("Math.abs", function () {
  jsc.property("result is non-negative", "integer 100", function (x) {
    return Math.abs(x) >= 0;
  });
});

describe("typify", function () {
  describe("primitives", function () {
    it("integer", function () {
      jsc.assert(jsc.forall("integer", function (i) {
        return Math.round(i) === i;
      }));
    });

    jsc.property("integer with bounds", "integer 5", function (i) {
      return Math.round(i) === i && Math.abs(i) <= 5;
    });
  });

  describe("compositional", function () {
    it("sort is idempotent", function () {
      jsc.assert(jsc.forall("array integer", function (arr) {
        var sorted = _.sortBy(arr);
        return _.isEqual(_.sortBy(sorted), sorted);
      }));
    });
  });

  describe("function", function () {
    it("bool fn applied thrice", function () {
      var boolFunctionAppliedThrice =
        jsc.forall("bool -> bool", "bool", function (f, b) {
          return f(f(f(b))) === f(b);
        });
      jsc.assert(boolFunctionAppliedThrice);
    });
  });

  describe("square brackets are treated as an array", function () {
    it("sort is idempotent", function () {
      jsc.assert(jsc.forall("[integer]", function (arr) {
        var sorted = _.sortBy(arr);
        return _.isEqual(_.sortBy(sorted), sorted);
      }));
    });
  });

  describe("jsc.compile", function () {
    it("compiles dsl to arbitraries", function () {
      var arb = jsc.compile("[integer]");
      jsc.assert(jsc.forall(arb, function (arr) {
        var sorted = _.sortBy(arr);
        return _.isEqual(_.sortBy(sorted), sorted);
      }));
    });
  });

  describe("suchthat", function () {
    it("is supported too", function () {
      var arb = jsc.suchthat("nat", function (n) { return n > 1; });
      jsc.assert(jsc.forall(arb, function (n) {
        return n * n > n;
      }));
    });
  });

  describe("erroneous cases", function () {
    it("throws exception when invalid generator specified", function () {
      assert.throws(function () {
        jsc.forall("wedonthavethis", function (/* i */) { return true; });
      });
    });

    it("throws exception when unsupported typify type specified", function () {
      assert.throws(function () {
        jsc.forall("*", function (/* i */) { return true; });
      });
    });
  });
});
