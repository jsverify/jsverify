/* jshint node:true */
/* global describe, it */
"use strict";

var assert = require("assert");
var jsc = require("../lib/jsverify.js");

describe("jsc.generator", function () {
  describe("array", function () {
    it("is auto-curried", function () {
      function assertPredicate(arr) {
        arr.forEach(function (x) {
          assert(typeof x === "number");
        });
      }
      for (var i = 0; i < 20; i++) {
        assertPredicate(jsc.generator.array(jsc.nat().generator)(i));
        assertPredicate(jsc.generator.array(jsc.nat().generator, i));
      }
    });
  });

  describe("bless", function () {
    it("map", function () {
      var gen = jsc.generator.array(jsc.nat().generator).map(function (arr) { return arr.slice(0, 1); });
      function assertPredicate(arr) {
        return arr.length <= 1;
      }
      for (var i = 0; i < 20; i++) {
        assertPredicate(gen(i));
      }
    });
  });

  describe("map", function () {
    it("is auto-curried", function () {
      function assertPredicate(obj) {
        Object.keys(obj).forEach(function (k) {
          assert(typeof obj[k] === "number");
        });
      }
      for (var i = 0; i < 20; i++) {
        assertPredicate(jsc.generator.map(jsc.nat().generator)(i));
        assertPredicate(jsc.generator.map(jsc.nat().generator, i));
      }
    });
  });

  describe("oneof", function () {
    it("is auto-curried", function () {
      function assertPredicate(x) {
        assert(typeof x === "number" || typeof x === "string");
      }
      for (var i = 0; i < 20; i++) {
        assertPredicate(jsc.generator.oneof([jsc.nat().generator, jsc.string().generator])(i));
        assertPredicate(jsc.generator.oneof([jsc.nat().generator, jsc.string().generator], i));
      }
    });
  });
});
