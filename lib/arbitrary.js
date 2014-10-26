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

/**
  - `array(arb: arbitrary a): arbitrary (array a)`
*/
function array(arb) {
  arb = utils.force(arb || primitive.json);

  return {
    generator: function (size) {
      return generator.array(arb.generator, size);
    },

    shrink: shrink.array.bind(null, arb.shrink),
    show: show.array.bind(null, arb.show),
  };
}

/**
  - `pair(arbA: arbitrary a, arbB : arbitrary b): arbitrary (pair a b)`

      If not specified `a` and `b` are equal to `value()`.
*/
function pair(a, b) {
  a = utils.force(a || primitive.json);
  b = utils.force(b || primitive.json);

  return {
    generator: function (size) {
      return [a.generator(size), b.generator(size)];
    },

    shrink: function (p) {
      return shrink.tuple([a.shrink, b.shrink], p);
    },

    show: show.def,
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
    generator: function (size) {
      var arrayOfPairs = arrayArbitrary.generator(size);
      return fromArray(arrayOfPairs);
    },
    shrink: function (m) {
      var arrayOfPairs = toArray(m);
      var shrinked = arrayArbitrary.shrink(arrayOfPairs);
      return shrinked.map(fromArray);
    },
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
    generator: function (size) {
      var res = {};
      Object.keys(spec).forEach(function (k) {
        res[k] = forcedSpec[k].generator(size);
      });
      return res;
    },
    shrink: function (value) {
      // TODO: use mapValues
      var shrinkSpec = {};
      Object.keys(forcedSpec).forEach(function (k) {
        shrinkSpec[k] = forcedSpec[k].shrink;
      });
      return shrink.record(shrinkSpec, value);
    },
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
  array: array,
  map: map,
  oneof: oneof,
  record: record,
};
