"use strict";

var combinator = require("./combinator.js");
var composite = require("./composite.js");
var fn = require("./fn.js");
var primitive = require("./primitive.js");

var environment = {
  nat: primitive.nat,
  integer: primitive.integer,
  number: primitive.number,
  bool: primitive.bool,
  char: primitive.char,
  string: primitive.string,
  value: primitive.value,
  asciichar: primitive.asciichar,
  asciistring: primitive.asciistring,
  uint8: primitive.uint8,
  uint16: primitive.uint16,
  uint32: primitive.uint32,
  int8: primitive.int8,
  int16: primitive.int16,
  int32: primitive.int32,
  pair: composite.pair,
  array: composite.array,
  map: composite.map,
  fn: fn.fn,
  fun: fn.fn,
  nonshrink: combinator.nonshrink,
};

module.exports = environment;
