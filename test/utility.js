/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../lib/jsverify.js");
var _ = require("underscore");
var assert = require("assert");

describe("utility functions: _", function () {
  describe("isEqual", function () {
    it("is true for all values", function () {
      jsc.assert(jsc.forall(jsc.value(), function (x) {
        return jsc._.isEqual(x, JSON.parse(JSON.stringify(x)));
      }));
    });

    it("returns same as _.isEqual", function () {
      function predicate(x, y) {
        return _.isEqual(x, y) === jsc._.isEqual(x, y);
      }

      jsc.assert(jsc.forall(jsc.value(), jsc.value(), predicate));

      // also special cases
      assert(predicate({ a: 1, b: 2 }, { a: 1, b: 3 }));
      assert(predicate({ a: 2, b: 2 }, { a: 1, b: 3 }));
      assert(predicate({ a: 1}, { b: 1 }));
    });

    it("is reflexive", function () {
      jsc.assert(jsc.forall(jsc.value(), function (x) {
        return jsc._.isEqual(x, x);
      }));
    });
  });

  describe("FMap", function () {
    it("insert into same key overwrites previous", function () {
      var m = new jsc._.FMap();
      m.insert([0], 1);
      m.insert([0], 2);
      assert.strictEqual(m.get([0]), 2);
    });

    it("works as object for integer keys", function () {
      var prop = jsc.forall(jsc.array(jsc.pair(jsc.integer())), function (l) {
        var m = new jsc._.FMap();
        var o = {};

        l.forEach(function (p) {
          m.insert(p[0], p[1]);
          o[p[0]] = p[1];
        });

        return Object.keys(o).every(function (k) {
          return o[k] === m.get(parseInt(k, 10));
        });
      });

      jsc.assert(prop);
    });
  });
});
