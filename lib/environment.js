"use strict";

var combinator = require("./combinator.js");
var composite = require("./composite.js");
var fn = require("./fn.js");
var primitive = require("./primitive.js");

var environment = {
  nat: primitive.nat,
  integer: primitive.integer,
  number : primitive.number,
  bool: primitive.bool,
  string: primitive.string,
  value: primitive.value,
  pair: composite.pair,
  array: composite.array,
  map: composite.map,
  fn: fn.fn,
  fun: fn.fn,
  nonshrink: combinator.nonshrink,
};

module.exports = environment;
