/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../lib/jsverify.js");
var assert = require("assert");
var _ = require("underscore");

describe("record", function () {
  it("generates objects according to the spec", function () {
    var spec = {
      a: jsc.string,
      b: jsc.nat,
      c: jsc.fn
    };

    jsc.assert(jsc.forall(jsc.record(spec), function (obj) {
      return _.isObject(obj) &&
             _.isString(obj.a) &&
             _.isNumber(obj.b) &&
             _.isFunction(obj.c);
    }));
  });

  // TODO: can be shrinked
  it("cannot be shrinked", function () {
    var property = jsc.forall(jsc.record({a: jsc.fn()}), function (x) {
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
