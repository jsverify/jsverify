/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../lib/jsverify.js");
var _ = require("underscore");

describe("oneof", function () {
  it("uses one generator from the given parameters", function () {
    var gen = jsc.oneof(jsc.number, jsc.string);
    jsc.assert(jsc.forall(gen, function (x) {
      return _.isNumber(x) || _.isString(x);
    }));
  });

  it("uses one generator from the given array", function () {
    var gen = jsc.oneof([jsc.number, jsc.string]);
    jsc.assert(jsc.forall(gen, function (x) {
      return _.isNumber(x) || _.isString(x);
    }));
  });
});
