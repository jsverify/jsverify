/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../lib/jsverify.js");
var _ = require("lodash");
var expect = require("chai").expect;

describe("jsc.utils", function () {
  describe("merge", function () {
    it("≡ _.extend({}, ...", function () {
      jsc.assert(jsc.forall("dict", "dict", function (x, y) {
        var a = jsc.utils.merge(x, y);
        var b = _.extend({}, x, y);
        return _.isEqual(a, b);
      }));
    });
  });

  describe("ilog2", function () {
    it("returns integers, examples", function () {
      expect(jsc.utils.ilog2(0)).to.equal(0);
      expect(jsc.utils.ilog2(1)).to.equal(0);
      expect(jsc.utils.ilog2(2)).to.equal(1);
      expect(jsc.utils.ilog2(3)).to.equal(1);
      expect(jsc.utils.ilog2(4)).to.equal(2);
    });
  });

  describe("isApproxEqual", function () {
    jsc.property("isApproxEqual(a: nat, b: nat) ≡ a === b", "nat", "nat", function (a, b) {
      return jsc.utils.isApproxEqual(a, b) === (a === b);
    });

    jsc.property("isApproxEqual(a: json, b: json) ≡ isEqual(a, b)", "json", "json", function (a, b) {
      return jsc.utils.isApproxEqual(a, b) === jsc.utils.isEqual(a, b);
    });

    jsc.property("is reflexive", "json", function (a) {
      return jsc.utils.isApproxEqual(a, a);
    });

    jsc.property("is reflexive, deepcopy", "json", function (a) {
      return jsc.utils.isApproxEqual(a, _.cloneDeep(a));
    });

    jsc.property("depth", function () {
      var a = [1, [2, [3, [4, [5, [6, []]]]]]];
      var b = [1, [2, [3, [4, [5, [9, []]]]]]];

      return jsc.utils.isApproxEqual(a, b, { depth: 6 }) === true &&
        jsc.utils.isApproxEqual(a, b, { depth: 7 }) === false;
    });

    jsc.property("circular 1", function () {
      var a = [1, [2, null]];
      var b = [1, [2, null]];
      a[1][1] = a;
      b[1][1] = b;

      return jsc.utils.isApproxEqual(a, b, { depth: Infinity }) === true;
    });

    jsc.property("circular - different cycle", function () {
      var a = [1, [1, null]];
      var b = [1, [1, [1, null]]];
      a[1][1] = a;
      b[1][1][1] = b;

      return jsc.utils.isApproxEqual(a, b, { depth: Infinity }) === true;
    });

    jsc.property("functions", "nat -> nat", "nat -> nat", function (f, g) {
      return jsc.utils.isApproxEqual(f, f) === true &&
        jsc.utils.isApproxEqual(f, g) === true &&
        jsc.utils.isApproxEqual(f, f, { fnEqual: false }) === true &&
        jsc.utils.isApproxEqual(f, g, { fnEqual: false }) === false;
    });

    jsc.property("objects with same keys", function () {
      return jsc.utils.isApproxEqual({ a: 1, b: 2 }, { a: 2, b: 2 }) === false &&
        jsc.utils.isApproxEqual({ a: 1, b: 2 }, { a: 1, b: 1 }) === false;
    });
  });
});
