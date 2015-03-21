/* jshint node:true */
/* global describe */
"use strict";

var jsc = require("../lib/jsverify.js");
var _ = require("underscore");

describe("unit", function () {
  jsc.property("is represented by an empty array", "unit", function (x) {
    return _.isEqual(x, []);
  });
});

describe("either", function () {
  jsc.property("generates either", "either bool nat", function (e) {
    return _.contains(["left", "right"],
      e.either(_.constant("left"), _.constant("right")));
  });

  jsc.property("generates either json json, if params omitted", "either", function (e) {
    return _.contains(["left", "right"],
      e.either(_.constant("left"), _.constant("right")));
  });

  jsc.property("show left", "nat", function (n) {
    var arb = jsc.either(jsc.nat, jsc.nat);
    return arb.show(jsc.left(n)) === "Left(" + n + ")";
  });

  jsc.property("show right", "nat", function (n) {
    var arb = jsc.either(jsc.nat, jsc.nat);
    return arb.show(jsc.right(n)) === "Right(" + n + ")";
  });

  describe("isEqual", function () {
    jsc.property(".isEqual is reflexive", "either nat bool", function (e) {
      return e.isEqual(e);
    });

    jsc.property("Left and Right are inequal, 1", "nat", function (n) {
      return !jsc.left(n).isEqual(jsc.right(n));
    });

    jsc.property("Left and Right are inequal, 2", "nat", function (n) {
      return !jsc.right(n).isEqual(jsc.left(n));
    });
  });

  describe("bimap", function () {
    jsc.property("compose", "either nat nat", "nat -> nat", "nat -> nat", "nat -> nat", "nat -> nat", function (e, f, g, h, i) {
      var lhs = e.bimap(_.compose(f, g), _.compose(h, i));
      var rhs = e.bimap(g, i).bimap(f, h);
      return lhs.isEqual(rhs);
    });
  });

  jsc.property("either.first(f) ≡ either.bimap(f, _.identity)", "either nat nat", "nat -> nat", function (e, f) {
    var lhs = e.first(f);
    var rhs = e.bimap(f, _.identity);
    return lhs.isEqual(rhs);
  });

  jsc.property("either.second(f) ≡ either.bimap(_.identity, f)", "either nat nat", "nat -> nat", function (e, f) {
    var lhs = e.second(f);
    var rhs = e.bimap(_.identity, f);
    return lhs.isEqual(rhs);
  });

  describe("shrink", function () {
    var arb = jsc.either(jsc.nat, jsc.nat);
    jsc.property("lefts to lefts, rights to rights", "either nat nat", function (e) {
      var l = _.constant("left");
      var r = _.constant("right");
      var elr = e.either(l, r);
      return arb.shrink(e).every(function (s) {
        return elr === s.either(l, r);
      });
    });
  });
});
