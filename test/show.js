/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../lib/jsverify.js");

function stringifyShowProperty(arb) {
  return jsc.forall(arb, function (x) {
    return !!arb.show(x).match(/^".*"$/);
  });
}

describe("primitive show", function () {
  describe("char", function () {
    it("show returns string wrapped in quotes", function () {
      jsc.assert(stringifyShowProperty(jsc.char));
    });
  });

  describe("asciichar", function () {
    it("show returns string wrapped in quotes", function () {
      jsc.assert(stringifyShowProperty(jsc.asciichar));
    });
  });

  describe("string", function () {
    it("show returns string wrapped in quotes", function () {
      jsc.assert(stringifyShowProperty(jsc.string));
    });
  });

  describe("nestring", function () {
    it("show returns string wrapped in quotes", function () {
      jsc.assert(stringifyShowProperty(jsc.nestring));
    });
  });

  describe("asciistring", function () {
    it("show returns string wrapped in quotes", function () {
      jsc.assert(stringifyShowProperty(jsc.asciistring));
    });
  });
});
