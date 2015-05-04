"use strict";

var generator = require("./generator.js");
var arbitraryBless = require("./arbitraryBless.js");
var arbitraryAssert = require("./arbitraryAssert.js");
var utils = require("./utils.js");

function smallGenerator(gen) {
  // TODO: assertGenerator(gen)
  return generator.bless(function (size) {
    return gen(utils.ilog2(size));
  });
}

function smallArbitraryImpl(arb) {
  arbitraryAssert(arb);
  return arbitraryBless({
    generator: smallGenerator(arb.generator),
    shrink: arb.shrink,
    show: arb.show,
  });
}

function smallArbitrary(arb) {
  if (typeof arb === "function") {
    return function () {
      var resArb = arb.apply(arb, arguments);
      return smallArbitraryImpl(resArb);
    };
  } else { /* if (typeof arb === "object") */
    return smallArbitraryImpl(arb);
  }
}

module.exports = {
  generator: smallGenerator,
  arbitrary: smallArbitrary,
};
