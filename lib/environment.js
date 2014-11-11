"use strict";

var arbitrary = require("./arbitrary.js");
var fn = require("./fn.js");
var primitive = require("./primitive.js");

var environment = {
  nat: primitive.nat,
  integer: primitive.integer,
  number: primitive.number,
  bool: primitive.bool,
  falsy: primitive.falsy,
  char: primitive.char,
  string: primitive.string,
  nestring: primitive.nestring,
  json: primitive.json,
  value: primitive.json,
  asciichar: primitive.asciichar,
  asciistring: primitive.asciistring,
  uint8: primitive.uint8,
  uint16: primitive.uint16,
  uint32: primitive.uint32,
  int8: primitive.int8,
  int16: primitive.int16,
  int32: primitive.int32,
  pair: arbitrary.pair,
  array: arbitrary.array,
  nearray: arbitrary.nearray,
  map: arbitrary.map,
  fn: fn.fn,
  fun: fn.fn,
  nonshrink: arbitrary.nonshrink,
};

module.exports = environment;
