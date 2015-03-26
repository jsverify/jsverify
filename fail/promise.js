/* jshint node:true */
/* global describe */
"use strict";

var jsc = require("../lib/jsverify.js");

function promiseSpec(library, delay) {
  var promise = require(library);
  describe("failing tests", function () {
    jsc.property("fails", "nat", function () {
      return delay(promise).then(function () {
        throw new Error("fail always");
      });
    });

    jsc.property("fails", function () {
      return delay(promise).then(function () {
        throw new Error("fail always");
      });
    });

    jsc.property("foo", jsc.constant('bar'), function () {
      return Promise.resolve(false).delay(10)
    });
  });
}

promiseSpec("q", function (q) { return q.delay(1); });
promiseSpec("when", function (when) { return when.resolve().delay(1); });
promiseSpec("bluebird", function (Bluebird) { return Bluebird.resolve().delay(1); });
