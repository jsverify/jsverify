/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../lib/jsverify.js");
var _ = require("underscore");
var assert = require("assert");

describe("primitive arbitraries", function () {
  describe("falsy", function () {
    it("generates falsy values", function () {
      jsc.assert(jsc.forall(jsc.falsy, function (x) {
        return !x;
      }));
    });

    it("generates falsy values, dsl", function () {
      jsc.assert(jsc.forall("falsy", function (x) {
        return !x;
      }));
    });

    jsc.property("generates falsy values, dsl - property", "falsy", function (x) {
      return !x;
    });

    function falsyShowProperty(x) {
      return jsc.falsy.show(x).match(/^falsy: /) !== null;
    }

    jsc.property("show returns string starting with 'falsy: '", "falsy", falsyShowProperty);
    it("show returns string starting with 'falsy' - special cases", function () {
      assert(falsyShowProperty(0));
      assert(falsyShowProperty(undefined));
      assert(falsyShowProperty(""));
      assert(falsyShowProperty(false));
      assert(falsyShowProperty(null));
      assert(falsyShowProperty(NaN));
    });
  });

  describe("integer", function () {
    it("generates integers", function () {
      jsc.assert(jsc.forall(jsc.integer(), function (i) {
        return Math.round(i) === i;
      }));
    });

    it("with maxsize, generates integers: abs(_) ≤  maxsize", function () {
      jsc.assert(jsc.forall(jsc.integer(5), function (i) {
        return Math.round(i) === i && Math.abs(i) <= 5;
      }));
    });

    it("with min & max, generates integers: min ≤ _ ≤ max", function () {
      jsc.assert(jsc.forall(jsc.integer(2, 5), function (i) {
        return Math.round(i) === i && i >= 2 && i <= 5;
      }));
    });
  });

  describe("nat", function () {
    it("generates non-negative integers", function () {
      jsc.assert(jsc.forall(jsc.nat(), function (n) {
        return Math.round(n) === n && n >= 0;
      }));
    });
  });

  describe("number", function () {
    it("generates numbers", function () {
      jsc.assert(jsc.forall(jsc.number(), function (x) {
        return typeof x === "number";
      }));
    });

    it("doesn't generate Infinity", function () {
      jsc.assert(jsc.forall(jsc.number(), function (x) {
        return x !== Infinity;
      }));
    });

    it("doesn't generate NaN", function () {
      jsc.assert(jsc.forall(jsc.number(), function (x) {
        return !isNaN(x);
      }));
    });

    it("with maxsize, generates numbers: abs(_) <  maxsize", function () {
      jsc.assert(jsc.forall(jsc.number(5.5), function (i) {
        return typeof i === "number" && Math.abs(i) < 5.5;
      }));
    });

    it("with min & max, generates numbers: min ≤ _ < max", function () {
      jsc.assert(jsc.forall(jsc.number(2.2, 5.5), function (i) {
        return typeof i === "number" && i >= 2.2 && i < 5.5;
      }));
    });
  });

  describe("uint8", function () {
    it("generates numbers", function () {
      jsc.assert(jsc.forall("uint8", function (x) {
        return typeof x === "number";
      }));
    });

    it("generates integral numbers between 0 and 255", function () {
      jsc.assert(jsc.forall("uint8", function (x) {
        return (x & 0xff) === x;
      }));
    });
  });

  describe("bool", function () {
    it("generates either true or false", function () {
      jsc.assert(jsc.forall(jsc.bool, function (b) {
        return b === true || b === false;
      }));
    });
  });

  describe("char", function () {
    it("generates string of length 1", function () {
      jsc.assert(jsc.forall("char", function (x) {
        return typeof x === "string" && x.length === 1;
      }));
    });
  });

  describe("string", function () {
    it("generates string", function () {
      jsc.assert(jsc.forall(jsc.string(), function (x) {
        return typeof x === "string";
      }));
    });
  });

  describe("asciistring", function () {
    it("generates string", function () {
      jsc.assert(jsc.forall("asciistring", function (x) {
        return typeof x === "string";
      }));
    });

    it("generates with only ascii characters", function () {
      jsc.assert(jsc.forall("asciistring", function (x) {
        return x
          .split("")
          .map(function (c) {
            return c.charCodeAt(0);
          })
          .every(function (code) {
            return code >= 32 && code < 128;
          });
      }));
    });
  });

  describe("tuple", function () {
    it("generates tuples", function () {
      var arb = jsc.tuple([jsc.nat, jsc.string, jsc.bool]);
      jsc.assert(jsc.forall(arb, function (tri) {
        return typeof tri[0] === "number" && typeof tri[1] === "string" && typeof tri[2] === "boolean";
      }));
    });
  });

  describe("array", function () {
    it("generates array", function () {
      jsc.assert(jsc.forall(jsc.array(), function (arr) {
        return _.isArray(arr);
      }));
    });
  });

  describe("nonshrink array", function () {
    it("generates array", function () {
      jsc.assert(jsc.forall(jsc.nonshrink(jsc.array()), function (arr) {
        return _.isArray(arr);
      }));
    });
  });

  describe("value", function () {
    it("generates json stringify parse invariant", function () {
      jsc.assert(jsc.forall(jsc.json, function (x) {
        return _.isEqual(x, JSON.parse(JSON.stringify(x)));
      }));
    });
  });

  describe("fun", function () {
    it("generates functions", function () {
      jsc.assert(jsc.forall(jsc.fn(), function (f) {
        return typeof f === "function";
      }));
    });

    it("generates well-behaved functions", function () {
      jsc.assert(jsc.forall(jsc.fn(), jsc.json, function (f, x) {
        return f(x) === f(x);
      }));

      jsc.assert(jsc.forall(jsc.fn(), function (f) {
        for (var i = 0; i < 10; i++) {
          if (f(i) !== f(i)) {
            return false;
          }
        }

        return true;
      }));
    });
  });

  describe("elements", function () {
    it("picks one from argument array", function () {
      jsc.assert(jsc.forall(jsc.nearray(), function (arr) {
        return jsc.forall(jsc.elements(arr), function (e) {
          return _.contains(arr, e);
        });
      }));
    });
  });

  describe("datetime", function () {
    jsc.property("should return date", "datetime", function (d) {
      return d instanceof Date;
    });

    it("takes two parameters for range", function () {
      var now = new Date();
      var nextHour = new Date(now.getTime() + 3600 * 1000);
      jsc.assert(jsc.forall(jsc.datetime(now, nextHour), function (d) {
        return now.getTime() <= d.getTime() && d.getTime() <= nextHour.getTime();
      }));
    });
  });

  describe("constant", function () {
    it("should always generate the given value", function () {
      jsc.assert(jsc.forall(jsc.json, function (a) {
        return jsc.forall(jsc.constant(a), function (b) {
          return a === b;
        });
      }));
    });
  });

  describe("nestring", function () {
    it("should generate non empty strings", function () {
      jsc.assert(jsc.forall(jsc.nestring, function (s) {
        return typeof s === "string" && s.length > 0;
      }));
    });
  });
});
