/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../lib/jsverify.js");
var assert = require("assert");

describe("sampler", function () {
  it("generates arbitraries of non-zero size by default", function () {
    var arb = jsc.array(jsc.constant("foo"));
    var sampler = jsc.sampler(arb);

    var values = sampler(100);

    assert(values.some(function (arr) {
      return arr.length > 0;
    }));

    assert(values.every(function (arr) {
      return arr.every(function (x) {
        return x === "foo";
      });
    }));
  });

  it("generates single argument if size is not given", function () {
    var arb = jsc.constant("foo");
    var sampler = jsc.sampler(arb);

    var value = sampler();
    assert(value === "foo");
  });

  it("generates arbitraries of given size", function () {
    var size = 5;
    var arb = jsc.array(jsc.constant("foo"));
    var sampler = jsc.sampler(arb, 5);

    var values = sampler(100);

    assert(values.some(function (arr) {
      return arr.length > 0 && arr.length < size;
    }));

    assert(values.every(function (arr) {
      return arr.every(function (x) {
        return x === "foo";
      });
    }));
  });
});
