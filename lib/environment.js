/* @flow weak */
"use strict";

var arbitrary = require("./arbitrary.js");
var fn = require("./fn.js");
var primitive = require("./primitive.js");
var string = require("./string.js");
var utils = require("./utils.js");

var environment = utils.merge(primitive, string, {
  pair: arbitrary.pair,
  unit: arbitrary.unit,
  either: arbitrary.either,
  map: arbitrary.map,
  array: arbitrary.array,
  nearray: arbitrary.nearray,
  json: arbitrary.json,
  fn: fn.fn,
  fun: fn.fn,
  nonshrink: arbitrary.nonshrink,
});

module.exports = environment;
