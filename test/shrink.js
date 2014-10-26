/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../lib/jsverify.js");
var assert = require("assert");
var _ = require("underscore");

function checkShrink(mincase, property, tries) {
  tries = tries || 20;
  var wasShrinked = false;

  for (var i = 0; i < tries; i++) {
    var r = jsc.check(property, { quiet: true });
    assert(r !== true, "property should not hold");
    if (mincase !== undefined) {
      assert.deepEqual(r.counterexample, mincase);
    }
    wasShrinked = wasShrinked || r.shrinks > 0;
  }

  assert(wasShrinked, "should be shrinked");
}

describe("shrink", function () {
  describe("nat", function () {
    it("shrinks to smaller values", function () {
      checkShrink([0], jsc.forall(jsc.nat(), function (n) {
        return n === n + 1;
      }));
    });
  });

  describe("integer", function () {
    it("shrinks to smaller values", function () {
      checkShrink([0], jsc.forall(jsc.integer(), function (n) {
        return n === n + 1;
      }));
    });

    it("shrinks to smaller values, 2", function () {
      checkShrink([2], jsc.forall(jsc.integer(), function (n) {
        return n < 2 ? true : n === n + 1;
      }));
    });
  });

  describe("bool", function () {
    it("shrinks to false", function () {
      checkShrink([false], jsc.forall(jsc.bool, function (b) {
        return b !== b;
      }));
    });
  });

  describe("pair", function () {
    it("shrinks both elements", function () {
      checkShrink([[false, false]], jsc.forall(jsc.pair(jsc.bool, jsc.bool), function (p) {
        return p[0] && p[0] !== p[1];
      }));
    });
  });

  describe("suchthat", function () {
    it("shrinks so predicate is true for all shrinked values still", function () {
      var oddNumbers = jsc.suchthat(jsc.nat(), function (n) {
        return n % 2 === 1;
      });

      checkShrink([3], jsc.forall(oddNumbers, function (n) {
        return n < 3 || n !== n;
      }), 100);
    });
  });

  describe("array", function () {
    it("shrinks to smaller arrays", function () {
      checkShrink([[1]], jsc.forall(jsc.array(jsc.nat()), function (arr) {
        return arr.length === 0 || arr[0] === 0;
      }));
    });
  });

  describe("string", function () {
    it("shrink of empty string is empty", function () {
      assert(jsc.string().shrink("").length === 0);
    });

    it("shrinked array contains empty string for non-empty input", function () {
      assert(jsc.string().shrink("foobar").indexOf("") !== -1);
    });
  });

  describe("asciistring", function () {
    it("shrink of empty asciistring is empty", function () {
      assert(jsc.asciistring.shrink("").length === 0);
    });

    it("shrinked array contains empty asciistring for non-empty input", function () {
      assert(jsc.asciistring.shrink("foobar").indexOf("") !== -1);
    });
  });

  describe("nonshrink array", function () {
    it("cannot be shrinked", function () {
      var property = jsc.forall(jsc.nonshrink(jsc.array(jsc.nat())), function (arr) {
        return arr.length === 0 || arr[0] === 0;
      });

      // try many times to get more examples
      for (var i = 0; i < 10; i++) {
        var r = jsc.check(property, { quiet: true });
        assert(r !== true);
        assert(r.shrinks === 0);
      }
    });
  });

  describe("map", function () {
    it("shrinks to smaller maps", function () {
      checkShrink([{"": 1}], jsc.forall(jsc.map(jsc.nat()), function (m) {
        return _.size(m) === 0 || _.some(m, function (value) { return value === 0; });
      }));
    });
  });

  describe("record", function () {
    it("shrinks as tuple", function () {
      checkShrink([{a: 0, b: []}], jsc.forall("{ a: nat; b: [bool] }", function (record) {
        return record.a === record.a + 1;
      }));
    });
  });

  describe("json", function () {
    it("cannot be shrinked, for now", function () {
      var property = jsc.forall(jsc.json, function (x) {
        return x !== x;
      });

      // try many times to get more examples
      for (var i = 0; i < 10; i++) {
        var r = jsc.check(property, { quiet: true });
        assert(r !== true);
        assert(r.shrinks === 0);
      }
    });
  });

  describe("function", function () {
    it("cannot be shrinked", function () {
      var property = jsc.forall(jsc.fn(), function (f) {
        return f(0) !== f(0);
      });

      // try many times to get more examples
      for (var i = 0; i < 10; i++) {
        var r = jsc.check(property, { quiet: true });
        assert(r !== true);
        assert(r.shrinks === 0);
      }
    });
  });

  describe("recursive definitions", function () {
    // TODO: jsverify doesn't find minimal 1, 1 case in recursive setting
    // this "monadic" bind is hard
    var property = jsc.forall(jsc.nat(), function (n) {
      return jsc.forall(jsc.nat(), function (m) {
        return n === 0 || m === 0 || m !== m;
      });
    });

    it("find minimal", function () {
      checkShrink(undefined, property);

      var property2 = jsc.forall(jsc.nat(), jsc.nat(), function (n, m) {
        return n === 0 || m === 0 || m !== m;
      });

      checkShrink([1, 1], property2);
    });
  });
});
