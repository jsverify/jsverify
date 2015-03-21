"use strict";

var arbitraryAssert = require("./arbitraryAssert.js");
var arbitraryBless = require("./arbitraryBless.js");
var generator = require("./generator.js");
var show = require("./show.js");
var shrink = require("./shrink.js");
var utils = require("./utils.js");

function arrayImpl(flavour) {
  return function array(arb) {
    arb = utils.force(arb);

    arbitraryAssert(arb);

    return arbitraryBless({
      generator: generator[flavour](arb.generator),
      shrink: shrink[flavour](arb.shrink),
      show: show.array(arb.show),
    });
  };
}

var array = arrayImpl("array");
var nearray = arrayImpl("nearray");

module.exports = {
  array: array,
  nearray: nearray,
};
