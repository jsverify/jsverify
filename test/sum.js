/* jshint node:true */
/* global describe */
"use strict";

var jsc = require("../lib/jsverify.js");

describe("sum", function () {
  jsc.property("generates either like", jsc.sum([jsc.bool, jsc.nat]), function (s) {
    return s.fold(function (idx, len, val) {
      return len === 2 && (
        (idx === 0 && typeof val === "boolean") ||
        (idx === 1 && typeof val === "number"));
    });
  });

  jsc.property("generates either like, dsl", "bool | nat", function (s) {
    return s.fold(function (idx, len, val) {
      return len === 2 && (
        (idx === 0 && typeof val === "boolean") ||
        (idx === 1 && typeof val === "number"));
    });
  });

  describe("shrink", function () {
    var arb = jsc.sum([jsc.bool, jsc.nat, jsc.string]);
    jsc.property("preserves idx and len", arb, function (e) {
      var eIdx = e.fold(function (idx) { return idx; });
      var eLen = e.fold(function (idx, len) { return len; });
      var shrinkSeq = arb.shrink(e);
      return shrinkSeq.every(function (s) {
        return eIdx === s.fold(function (idx) { return idx; }) &&
          eLen === s.fold(function (idx, len) { return len; });
      });
    });
  });

  describe("show", function () {
    var arb = jsc.sum([jsc.nat, jsc.string, jsc.bool]);
    jsc.property("works", "nat", function (n) {
      var s = arb.show(jsc.addend(0, 3, n));
      return s.indexOf(jsc.nat.show(n)) !== -1;
    });
  });
});
