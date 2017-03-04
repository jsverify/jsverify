/* jshint node:true */
/* global describe:false, it:false */
"use strict";

var assert = require("assert");
var jsc = require("../lib/jsverify.js");
var _ = require("underscore");

function toArray(s) {
  return s.fold(function (idx, len, val) { // eslint-disable-line consistent-return
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

describe("letrec", function () {
  it("builds mutually recursive arbitraries", function () {
    var arbs = jsc.letrec(function (tie) {
      return {
        arb1: jsc.oneof(jsc.unit, tie("arb2")),
        arb2: jsc.tuple([tie("arb1")]),
        arb3: tie("arb1"),
      };
    });

    arbs.arb1.shrink([]);

    jsc.assert(jsc.forall(arbs.arb1, function (l) {
      do {
        l = l[0];
      } while (_.isArray(l));
      return _.isUndefined(l);
    }));

    jsc.assert(jsc.forall(arbs.arb2, function (l) {
      do {
        l = l[0];
      } while (_.isArray(l));
      return _.isUndefined(l);
    }));

    jsc.assert(jsc.forall(arbs.arb3, function (l) {
      do {
        l = l[0];
      } while (_.isArray(l));
      return _.isUndefined(l);
    }));
  });

  it("throws if not all arbitraries are defined", function () {
    assert.throws(function () {
      jsc.letrec(function (tie) {
        return { arb1: tie("arb2") };
      });
    });
  });
});
