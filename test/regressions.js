/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../lib/jsverify.js");
var assert = require("assert");
var _ = require("lodash");

describe("regressions", function () {
  it("#20 - array size and element size is linked", function () {
    var arb = jsc.array(jsc.nat(10000));
    var ok = false;

    var pred = function (x) { return x > 5; };

    for (var i = 0; i < 100; i++) {
      var res = arb.generator(5);
      var larger = res.some(pred);
      if (larger) {
        ok = true;
        break;
      }
    }

    assert(ok, "explicit number size should be decoupled from passed size");
  });

  describe("#39 - Allow new generators in the DSLs environment", function () {
    var set = function (arb) {
      var arrayArb = jsc.array(arb);
      // _.id is "forgets" uniqueness: "set → array"
      return arrayArb.smap(_.uniq, _.identity, arrayArb.show);
    };

    var pred = function (xs) {
      return _.uniq(xs).length === xs.length;
    };

    var setArb = set(jsc.nat);
    var setShrink = setArb.shrink;

    it("generator sound", function () {
      // Property works
      var prop = jsc.forall(setArb, pred);
      jsc.assert(prop);
    });

    jsc.property("shrink example", function () {
      var value = setShrink([1, 2]).toArray();
      return _.every(value, pred);
    });

    it("shrink sound", function () {
      // Also shrinks!
      var shrinkProp = jsc.forall(setArb, function (xs) {
        var shrinked = setShrink(xs).toArray();
        return _.every(shrinked, pred);
      });
      jsc.assert(shrinkProp);
    });

    it("array shrink, may break invariant", function () {
      var arrayShrink = jsc.compile("array nat").shrink;

      var shrinked = arrayShrink([1, 2, 3]).toArray();
      assert(shrinked.some(function (xs) {
        return !pred(xs);
      }));
    });

    it("user environment works in suchthat", function () {
      var suchThatArb = jsc.suchthat("set nat", { set: set }, function () { return true; });
      jsc.assert(jsc.forall(suchThatArb, pred));
    });

    it("user environment works in forall", function () {
      jsc.assert(jsc.forall("set nat", { set: set }, pred));
    });

    it("user environment works in compile", function () {
      jsc.assert(jsc.forall(jsc.compile("set nat", { set: set }), pred));
    });
  });

  describe("issue #98", function () {
    jsc.property("shouldn't fail", function () {
      var n = jsc.int32.generator(100);
      return typeof n === "number";
    });
  });

  describe("#107: fn smap", function () {
    jsc.property("shouldn't fail", function () {
      var arb = jsc.fn(jsc.integer()).smap(function (v) { return { data: v }; }, function (v) { return v.data; });
      var prop = jsc.forall(arb, function (x) {
        return typeof x.data === "function";
      });
      return jsc.check(prop);
    });
  });

  describe("#113", function () {
    it("should not throw exception", function () {
      var arb = jsc.tuple([jsc.bool, jsc.array(jsc.bool), jsc.bool]);
      arb.shrink([true, [true, true], true]);
    });
  });

  describe("#112", function () {
    it("should support large test counts", function () {
      var prop = jsc.forall("nat", function (n) {
        return n === n;
      });

      jsc.assert(prop, { tests: 30000 });
    });
  });
});
