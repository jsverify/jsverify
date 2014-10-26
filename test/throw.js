/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../lib/jsverify.js");
var assert = require("assert");

function checkShrink(mincase, message, property) {
  var wasShrinked = false;

  for (var i = 0; i < 30; i++) {
    var r = jsc.check(property, { quiet: true });
    assert(r !== true, "property should not hold");
    assert(r.exc.message, message, "should pass message");
    if (mincase !== undefined) {
      assert.deepEqual(r.counterexample, mincase);
    }
    wasShrinked = wasShrinked || r.shrinks > 0;
  }

  assert(wasShrinked, "should be shrinked");
}

describe("properties that throws", function () {
  it("fail", function () {
    checkShrink([0], "foo", jsc.forall(jsc.nat(), function (/* n */) {
      throw new Error("foo");
    }));
  });

  it("fail if inner property", function () {
    checkShrink([0, 0], "foo", jsc.forall(jsc.nat(), function (/* n */) {
      return jsc.forall(jsc.nat(), function (/* m */) {
        throw new Error("foo");
      });
    }));
  });

  it("throwed string is in assert exception", function () {
    var err;
    try {
      jsc.assert(jsc.forall(jsc.nat(), function (/* n */) {
        throw "foo";
      }));
    } catch (e) {
      err = e.message;
    }

    assert(err);
    assert(/foo/.test(err));
  });

  it("throwed exception message is in assert exception", function () {
    var err;
    try {
      jsc.assert(jsc.forall(jsc.nat(), function (/* n */) {
        throw new Error("foo");
      }));
    } catch (e) {
      err = e.message;
    }

    assert(err);
    assert(/foo/.test(err));
  });
});
