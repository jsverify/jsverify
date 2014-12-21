/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../lib/jsverify.js");
var assert = require("assert");

describe("examples", function () {
  it("elements", function () {
    var prop1 = jsc.forall(jsc.elements(["foo", "bar", "quux"]), function (el) {
      return ["foo", "bar"].indexOf(el) !== -1;
    });

    assert(jsc.check(prop1) !== true);

    var prop2 = jsc.forall(jsc.elements(["foo", "bar", "quux"]), function (el) {
      return ["foo", "bar", "quux"].indexOf(el) !== -1;
    });

    assert(jsc.check(prop2) === true);
  });
});
