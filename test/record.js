/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../lib/jsverify.js");
var _ = require("underscore");

describe("record", function () {
  it("generates objects according to the spec", function () {
    var spec = {
      a: jsc.string,
      b: jsc.nat,
      c: jsc.fn,
    };

    jsc.assert(jsc.forall(jsc.record(spec), function (obj) {
      return _.isObject(obj) &&
             _.isString(obj.a) &&
             _.isNumber(obj.b) &&
             _.isFunction(obj.c);
    }));
  });

  it("supports environment", function () {
    var spec = {
      a: "string",
      b: "nat",
      c: "unit -> unit",
    };

    jsc.assert(jsc.forall(jsc.record(spec), function (obj) {
      return _.isObject(obj) &&
             _.isString(obj.a) &&
             _.isNumber(obj.b) &&
             _.isFunction(obj.c);
    }));
  });

  it("supports environment", function () {
    var userenv = {
      str: jsc.string,
    };

    var spec = {
      a: "str",
      b: "nat",
      c: "unit -> unit",
    };

    jsc.assert(jsc.forall(jsc.record(spec, userenv), function (obj) {
      return _.isObject(obj) &&
             _.isString(obj.a) &&
             _.isNumber(obj.b) &&
             _.isFunction(obj.c);
    }));
  });

  it("generates objects according to the dsl spec", function () {
    jsc.assert(jsc.forall("{ a: string; b: nat; c: (* -> bool) }", function (obj) {
      return _.isObject(obj) &&
             _.isString(obj.a) &&
             _.isNumber(obj.b) &&
             _.isFunction(obj.c) &&
             _.isBoolean(obj.c(42));
    }));
  });
});
