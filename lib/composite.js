/* jshint node:true */
"use strict";

var arbitrary = require("./arbitrary.js");
var shrink = require("./shrink.js");
var show = require("./show.js");
var primitive = require("./primitive.js");

/**
  #### array (gen : generator a) : generator (array a)
*/
function array(generator) {
  generator = generator || primitive.value();

  return {
    arbitrary: function (size) {
      return arbitrary.array(generator.arbitrary, size);
    },

    shrink: shrink.array.bind(null, generator.shrink),
    show: show.array.bind(null, generator.show),
  };
}

/**
  #### pair (a : generator A) (b : generator B) : generator (A * B)

  If not specified `a` and `b` are equal to `value()`.
*/
function pair(a, b) {
  a = a || primitive.value();
  b = b || primitive.value();

  return {
    arbitrary: function (size) {
      return [a.arbitrary(size), b.arbitrary(size)];
    },

    shrink: function (p) {
      return shrink.tuple([a.shrink, b.shrink], p);
    },

    show: show.def,
  };
}

module.exports = {
  pair: pair,
  array: array,
};
