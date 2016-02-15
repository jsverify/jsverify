/* jshint node:true */
/* global describe, it, beforeEach, afterEach */
"use strict";

var jsc = require("../lib/jsverify.js");
var assert = require("assert");

var cinfo = console.log;
var cerror = console.error;

beforeEach(function () {
  console.info = function () {};
  console.error = function () {};
});

afterEach(function () {
  console.info = cinfo;
  console.error = cerror;
});

describe("nonquiet cases", function () {
  it("check fail", function () {
    var r = jsc.check(jsc.forall(jsc.nat(), function (n) {
      return n === n + 1;
    }));

    assert(r !== true);
  });

  it("check succeed", function () {
    var r = jsc.check(jsc.forall(jsc.nat(), function (n) {
      return n === n;
    }));

    assert(r === true);
  });

  it("assert throws, also opts array", function () {
    assert.throws(function () {
      jsc.assert(jsc.forall(jsc.nat(), function (n) {
        return n !== n;
      }), { quiet: true });
    });
  });

  it("forall throws if passed something weird", function () {
    assert.throws(function () {
      jsc.check(jsc.forall(jsc.nat(), 1));
    });
  });

  it("assert rethrows exceptions thrown", function () {
    assert.throws(function () {
      jsc.assert(jsc.forall(jsc.nat(), function () {
        var e = new Error();
        e.stack = "xyzzy";
        e.extraData = 42;
        throw e;
      }), { quiet: true });
    }, function (e) {
      return e.message.indexOf("rngState") >= 0 &&
             e.stack === "xyzzy" &&
             e.extraData === 42;
    });
  });
});
