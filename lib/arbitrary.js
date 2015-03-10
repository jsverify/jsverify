/* @flow weak */
"use strict";

var assert = require("assert");
var generator = require("./generator.js");
var primitive = require("./primitive.js");
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

  return {
    generator: arb.generator,
    shrink: shrink.noop,
    show: arb.show,
  };
}

function arrayImpl(flavour) {
  return function array(arb) {
    arb = utils.force(arb || primitive.json);

    return {
      generator: generator[flavour](arb.generator),
      shrink: shrink[flavour](arb.shrink),
      show: show.array(arb.show),
    };
  };
}

/**
  - `array(arb: arbitrary a): arbitrary (array a)`
*/
var array = arrayImpl("array");

/**
  - `nearray(arb: arbitrary a): arbitrary (array a)`
*/
var nearray = arrayImpl("nearray");

/**
  - `unit: arbitrary ()`
*/
var unit = {
  generator: generator.unit,
  shrink: shrink.noop,
  show: show.def,
};

/**
  - `pair(arbA: arbitrary a, arbB : arbitrary b): arbitrary (pair a b)`

      If not specified `a` and `b` are equal to `value()`.
*/
function pair(a, b) {
  a = utils.force(a || primitive.json);
  b = utils.force(b || primitive.json);

  return {
    generator: generator.pair(a.generator, b.generator),
    shrink: shrink.pair(a.shrink, b.shrink),
    show: show.pair(a.show, b.show),
  };
}

/**
  - `tuple(arbs: (arbitrary a, arbitrary b...)): arbitrary (a, b...)`
*/
function tuple(arbs) {
  arbs = arbs.map(utils.force);
  return {
    generator: generator.tuple(utils.pluck(arbs, "generator")),
    shrink: shrink.tuple(utils.pluck(arbs, "shrink")),
    show: show.tuple(utils.pluck(arbs, "show")),
  };
}

/**
  - `map(arb: arbitrary a): arbitrary (map a)`

      Generates a JavaScript object with properties of type `A`.
*/
function fromArray(arrayOfPairs) {
  var res = {};
  arrayOfPairs.forEach(function (p) {
    res[p[0]] = p[1];
  });
  return res;
}

function toArray(m) {
  var res = [];
  Object.keys(m).forEach(function (k) {
    res.push([k, m[k]]);
  });
  return res;
}

function map(arb) {
  arb = utils.force(arb || primitive.json);
  var pairArbitrary = pair(primitive.string(), arb);
  var arrayArbitrary = array(pairArbitrary);

  return {
    generator: arrayArbitrary.generator.map(fromArray),
    shrink: arrayArbitrary.shrink.isomap(fromArray, toArray),
    show: function (m) {
      return "{" + Object.keys(m).map(function (k) {
        return k + ": " + arb.show(m[k]);
      }).join(", ") + "}";
    }
  };
}

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

  return {
    generator: generator.oneof(generators),
    // TODO: make shrink
    shrink: shrink.noop,
    show: show.def,
  };
}

/**
  - `record(spec: { key: arbitrary a... }): arbitrary { key: a... }`

      Generates a javascript object with given record spec.
*/
function record(spec) {
  var forcedSpec = {};
  // TODO: use mapValues
  Object.keys(spec).forEach(function (k) {
    forcedSpec[k] = utils.force(spec[k]);
  });

  return {
    generator: generator.bless(function (size) {
      var res = {};
      Object.keys(spec).forEach(function (k) {
        res[k] = forcedSpec[k].generator(size);
      });
      return res;
    }),
    shrink: shrink.bless(function (value) {
      // TODO: use mapValues
      var shrinkSpec = {};
      Object.keys(forcedSpec).forEach(function (k) {
        shrinkSpec[k] = forcedSpec[k].shrink;
      });
      return shrink.record(shrinkSpec, value);
    }),
    show: function (m) {
      return "{" + Object.keys(m).map(function (k) {
        return k + ": " + forcedSpec[k].show(m[k]);
      }).join(", ") + "}";
    }
  };
}

module.exports = {
  nonshrink: nonshrink,
  pair: pair,
  unit: unit,
  tuple: tuple,
  array: array,
  nearray: nearray,
  map: map,
  oneof: oneof,
  record: record,
};
