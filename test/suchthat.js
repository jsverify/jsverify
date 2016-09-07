/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../lib/jsverify.js");
var arbitraryAssert = require("../lib/arbitraryAssert.js");

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
});
