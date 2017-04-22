/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../lib/jsverify.js");
var arbitraryAssert = require("../lib/arbitraryAssert.js");
var expect = require("chai").expect;

describe("suchthat", function () {
  var arb = jsc.suchthat(jsc.integer, function (v) {
    return v % 2 === 0;
  });

  it("should construct valid arbitrary", function () {
    arbitraryAssert(arb);
  });

  it("should support smap", function () {
    var arbAsString = arb.smap(
      function (v) { return v.toString(); },
      function (v) { return parseInt(v, 10); }
    );

    jsc.assert(jsc.forall(arbAsString, function (value) {
      return typeof value === "string";
    }));

    jsc.assert(jsc.forall(arbAsString, function (value) {
      return parseInt(value, 10) % 2 === 0;
    }));
  });

  it("should fail after too many attempts at generating a value", function () {
    var degenerateArb = jsc.suchthat(jsc.nat, function () {
      return false;
    });

    try {
      jsc.assert(jsc.forall(degenerateArb, function () {
        return true;
      }));
    } catch (e) {
      expect(e.message).to.equal("Too many attempts trying to generate a value.");
    }
  });
});
