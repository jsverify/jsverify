/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../lib/jsverify.js");
var _ = require("underscore");

describe("jsc.utils", function () {
  describe("merge", function () {
    it("≡ _.extend({}, ...", function () {
      jsc.assert(jsc.forall("map", "map", function (x, y) {
        var a = jsc.utils.merge(x, y);
        var b = _.extend({}, x, y);
        return _.isEqual(a, b);
      }));
    });
  });

  describe("not", function () {
    /* jshint -W018 */
    // ignoring "confusing use of "!'" to ensure we"re comparing
    // the result is equal to `!x` as opposed to `!== x`, which
    // has a broader range of accepted (but incorrect) values
    it("should negate a given function", function () {
      jsc.assert(jsc.forall(jsc.fun(jsc.bool), function (f) {
        return jsc.utils.not(f)() === (!f());
      }));
    });
    /* jshint +W018 */
  });

  describe("or", function () {
    jsc.property("equivalent to (f[0](x) || f[1](x) || ...)", "array (* -> bool)", "nat", function (predicates, x) {
      var lhs = jsc.utils.or(predicates)(x);
      var rhs = predicates.reduce(function (acc, pred) { return acc || pred(x); } , false);
      return lhs === rhs;
    });

    jsc.property("is autocurried", "array (* -> bool)", "nat", function (predicates, x) {
      var lhs = jsc.utils.or(predicates, x);
      var rhs = predicates.reduce(function (acc, pred) { return acc || pred(x); } , false);
      return lhs === rhs;
    });
  });

  describe("and", function () {
    jsc.property("equivalent to (f[0](x) && f[1](x) && ...)", "array (* -> bool)", "nat", function (predicates, x) {
      var lhs = jsc.utils.and(predicates)(x);
      var rhs = predicates.reduce(function (acc, pred) { return acc && pred(x); } , true);
      return lhs === rhs;
    });

    jsc.property("is autocurried", "array (* -> bool)", "nat", function (predicates, x) {
      var lhs = jsc.utils.and(predicates, x);
      var rhs = predicates.reduce(function (acc, pred) { return acc && pred(x); } , true);
      return lhs === rhs;
    });
  });
});
