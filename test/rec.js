/* jshint node:true */
/* global describe:false, it:false */
"use strict";

var assert = require("assert");
var jsc = require("../lib/jsverify.js");

function toArray(s) {
  return s.fold(function (idx, len, val) {
    switch (idx) {
      case 0: return [];
      case 1: return [val[0]].concat(toArray(val[1]));
      // no default
    }
  });
}

function fromArray(arr) {
  if (arr.length === 0) {
    return jsc.addend(0, 2, []);
  } else {
    var h = arr[0];
    var t = arr.slice(1);
    return jsc.addend(1, 2, [h, fromArray(t)]);
  }
}

function arrayArb(elArb) {
  return jsc.compile("rec list -> unit | (el & list)", { el: elArb }).smap(toArray, fromArray);
}

describe("rec", function () {
  jsc.property("list/array example", arrayArb(jsc.nat), function (arr) {
    return Array.isArray(arr) && arr.every(function (el) {
      return typeof el === "number";
    });
  });

  it("prohibits recursive types without base case", function () {
    assert.throws(function () {
      jsc.compile("rec x -> x");
    });
  });

  it("prohibits recursive types without base case, 2", function () {
    assert.throws(function () {
      jsc.compile("rec x -> x | x");
    });
  });

  it("generates non-empty lists too", function () {
    var sampler = jsc.sampler(arrayArb(jsc.compile("nat")));
    var nonEmpty = false;
    for (var i = 0; i < 100; i++) {
      var arr = sampler();
      assert(Array.isArray(arr) && arr.every(function (n) { return typeof n === "number"; }));
      nonEmpty = nonEmpty || arr.length !== 0;
    }
    assert(nonEmpty, "arrayArb should generate non-empty arrays too");
  });
});
