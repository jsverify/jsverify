/* jshint node:true */
/* global describe */
"use strict";

var jsc = require("../lib/jsverify.js");
var _ = require("underscore");

describe("jsc.bless", function () {
  var arbA = jsc.bless({
    generator: jsc.generator.unit,
    shrink: function () { return []; },
  });

  var arbB = jsc.bless({
    generator: jsc.generator.unit,
    shrink: function () { return []; },
    show: jsc.show.def,
  });

  var arbC = jsc.bless({
    generator: function () { return []; },
  });

  jsc.property("a", "a", { a: arbA }, function (x) {
    return _.isEqual(x, []);
  });

  jsc.property("a - show", function () {
    return arbA.show([]) === "[]";
  });

  jsc.property("b", "b", { b: arbB }, function (x) {
    return _.isEqual(x, []);
  });

  jsc.property("b - show", function () {
    return arbB.show([]) === "[]";
  });

  jsc.property("c", "c", { c: arbC }, function (x) {
    return _.isEqual(x, []);
  });

  jsc.property("c - show", function () {
    return arbC.show([]) === "[]";
  });
});
