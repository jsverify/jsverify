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
    // Use .map and .isomap!
    var set = function (arb) {
      // Good to have this only once!
      var arrayArb = jsc.array(arb);
      return {
        generator: arrayArb.generator.map(_.uniq),
        shrink: arrayArb.shrink.isomap(_.uniq, _.identity), // _.id is "forgets" uniqueness: "set → array"
        show: arrayArb.show,
      };
    };

    var pred = function (xs) {
      return _.uniq(xs).length === xs.length;
    };

    it("generator sound", function () {
      // Property works
      var prop = jsc.forall(set(jsc.nat), pred);
      jsc.assert(prop);
    });

    it("shrink sound", function () {
      // Also shrinks!
      var shrink = set(jsc.nat).shrink;
      var shrinkProp = jsc.forall(set(jsc.nat), function (xs) {
        var shrinked = shrink(xs);
        return _.every(shrinked, pred);
      });
      jsc.assert(shrinkProp);
    });

    it("array shrink, may break invariant", function () {
      var shrink = jsc.compile("array nat").shrink;

      var shrinked = shrink([1, 2, 3]);
      assert(shrinked.some(function (xs) {
        return !pred(xs);
      }));
    });
  });
});
