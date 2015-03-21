/* @flow weak */
"use strict";

var arbitrary = require("./arbitrary.js");
var fn = require("./fn.js");
var primitive = require("./primitive.js");
var utils = require("./utils.js");

var environment = utils.merge(primitive, {
  pair: arbitrary.pair,
  unit: arbitrary.unit,
  either: arbitrary.either,
  array: arbitrary.array,
  nearray: arbitrary.nearray,
  map: arbitrary.map,
  fn: fn.fn,
  fun: fn.fn,
  nonshrink: arbitrary.nonshrink,
});

module.exports = environment;
