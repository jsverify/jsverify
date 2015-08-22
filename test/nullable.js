/* jshint node:true */
/* global describe */
"use strict";

var jsc = require("../lib/jsverify.js");
var _ = require("underscore");

describe("nullable example", function () {
  function toNullable(e) {
    return e.either(_.constant(null), _.identity);
  }

  function fromNullable(n) {
    return n === null ? jsc.left([]) : jsc.right(n);
  }

  var nullableNatArb = jsc.compile("either unit nat").smap(toNullable, fromNullable);

  var userEnv = {
    nullablenat: nullableNatArb,
  };

  jsc.property("nullable nat", "nullablenat", userEnv, function (n) {
    return n === null || typeof n === "number";
  });
});
