/* @flow weak */
"use strict";

var arbitraryAssert = require("./arbitraryAssert.js");
var arbitraryBless = require("./arbitraryBless.js");
var array = require("./array.js");
var assert = require("assert");
var dict = require("./dict.js");
var generator = require("./generator.js");
var json = require("./json.js");
var pair = require("./pair.js");
var show = require("./show.js");
var shrink = require("./shrink.js");
var utils = require("./utils.js");

/**
  ### Arbitrary combinators
*/

/**
  - `nonshrink(arb: arbitrary a): arbitrary a`

      Non shrinkable version of arbitrary `arb`.
*/
function nonshrink(arb) {
  arb = utils.force(arb);

  return arbitraryBless({
    generator: arb.generator,
    shrink: shrink.noop,
    show: arb.show,
  });
}

/**
  - `unit: arbitrary ()`
*/
var unit = arbitraryBless({
  generator: generator.unit,
  shrink: shrink.noop,
  show: show.def,
});

/**
  - `either(arbA: arbitrary a, arbB : arbitrary b): arbitrary (either a b)`
*/
function either(a, b) {
  a = utils.force(a || json.json);
  b = utils.force(b || json.json);

  arbitraryAssert(a);
  arbitraryAssert(b);

  return arbitraryBless({
    generator: generator.either(a.generator, b.generator),
    shrink: shrink.either(a.shrink, b.shrink),
    show: show.either(a.show, b.show),
  });
}

/**
  - `pair(arbA: arbitrary a, arbB : arbitrary b): arbitrary (pair a b)`

      If not specified `a` and `b` are equal to `value()`.
*/
function pairArb(a, b) {
  return pair.pair(a || json.json, b || json.json);
}

/**
  - `tuple(arbs: (arbitrary a, arbitrary b...)): arbitrary (a, b...)`
*/
function tuple(arbs) {
  arbs = arbs.map(utils.force);
  return arbitraryBless({
    generator: generator.tuple(utils.pluck(arbs, "generator")),
    shrink: shrink.tuple(utils.pluck(arbs, "shrink")),
    show: show.tuple(utils.pluck(arbs, "show")),
  });
}

/**
  - `sum(arbs: (arbitrary a, arbitrary b...)): arbitrary (a | b ...)`
*/
function sum(arbs) {
  arbs = arbs.map(utils.force);
  return arbitraryBless({
    generator: generator.sum(utils.pluck(arbs, "generator")),
    shrink: shrink.sum(utils.pluck(arbs, "shrink")),
    show: show.sum(utils.pluck(arbs, "show")),
  });
}
/**
  - `dict(arb: arbitrary a): arbitrary (dict a)`

      Generates a JavaScript object with properties of type `A`.
*/
function dictArb(arb) {
  return dict.arbitrary(arb || json.json);
}

/**
  - `array(arb: arbitrary a): arbitrary (array a)`
*/
function arrayArb(arb) {
  return array.array(arb || json.json);
}

/**
  - `nearray(arb: arbitrary a): arbitrary (array a)`
*/
function nearrayArb(arb) {
  return array.nearray(arb || json.json);
}

/**
  - `json: arbitrary json`

       JavaScript Objects: boolean, number, string, array of `json` values or object with `json` values.
*/
var jsonArb = json.json;

/**
  - `oneof(gs : array (arbitrary a)...) : arbitrary a`

      Randomly uses one of the given arbitraries.
*/
function oneof() {
  assert(arguments.length !== 0, "oneof: at least one parameter expected");

  // TODO: write this in more functional way
  var generators = [];
  var append = function (a) {
    generators.push(utils.force(a).generator);
  };
  for (var i = 0; i < arguments.length; i++) {
    var arg = arguments[i];
    if (utils.isArray(arg)) {
      arg.forEach(append);
    } else {
      append(arg);
    }
  }

  return arbitraryBless({
    generator: generator.oneof(generators),
    // TODO: make shrink
    shrink: shrink.noop,
    show: show.def,
  });
}

function recursive(arbZ, arbS) {
  var genZ = arbZ.generator;
  var genS = function (recGen) {
    var recArb = arbitraryBless({
      generator: recGen,
      shrink: shrink.noop,
      show: show.def,
    });
    return arbS(recArb).generator;
  };

  var gen = generator.recursive(genZ, genS);
  return arbitraryBless({
    generator: gen,
    shrink: shrink.noop,
    show: show.def,
  });
}

module.exports = {
  nonshrink: nonshrink,
  pair: pairArb,
  either: either,
  unit: unit,
  dict: dictArb,
  json: jsonArb,
  nearray: nearrayArb,
  array: arrayArb,
  tuple: tuple,
  sum: sum,
  oneof: oneof,
  recursive: recursive,
};
