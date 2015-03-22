/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../lib/jsverify.js");
var _ = require("underscore");

describe("generator combinators", function () {
  describe("pair", function () {
    it("generates array of two elements", function () {
      jsc.assert(jsc.forall(jsc.pair(jsc.integer(), jsc.integer()), function (p) {
        return _.isArray(p) && p.length === 2 &&
          typeof p[0] === "number" && typeof p[1] === "number";
      }));
    });

    it("without parameters generates pair of values", function () {
      jsc.assert(jsc.forall(jsc.pair(), function (p) {
        return _.isArray(p) && p.length === 2;
      }));
    });
  });

  describe("dict", function () {
    it("generates objects with properties of given type", function () {
      jsc.assert(jsc.forall(jsc.dict(jsc.integer()), function (m) {
        return _.isObject(m) && _.every(m, _.isNumber);
      }));
    });

    it("generates objects with properties of values, if type omitted", function () {
      jsc.assert(jsc.forall(jsc.dict(), function (m) {
        return _.isObject(m);
      }));
    });
  });
});
