/* jshint node:true */
/* global describe */
"use strict";

var jsc = require("../lib/jsverify.js");

describe("throws", function () {
  jsc.property("example 1", "bool", function (b) {
    var block = function () {
      if (b) { throw new Error("foo"); }
    };

    return jsc.throws(block) === b;
  });

  jsc.property("class", "bool", function (b) {
    var block = function () {
      throw (b ? new Error("foo") : "foo");
    };

    return jsc.throws(block, Error) === b;
  });

  jsc.property("message", "bool", "string", function (b, msg) {
    var block = function () {
      throw (b ? new Error(msg) : "other-error");
    };

    return jsc.throws(block, Error, msg) === b;
  });

  jsc.property("regex", "bool", "string", function (b, msg) {
    var block = function () {
      throw (b ? new Error(msg) : "other-error");
    };

    return jsc.throws(
      block,
      Error,
      new RegExp(msg.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"))
    ) === b;
  });
});
