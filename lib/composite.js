"use strict";

var arbitrary = require("./arbitrary.js");
var shrink = require("./shrink.js");
var show = require("./show.js");
var primitive = require("./primitive.js");
var generator = require("./generator.js");

/**
  #### array (gen : generator a) : generator (array a)
*/
function array(gen) {
  gen = generator.force(gen || primitive.value);

  return {
    arbitrary: function (size) {
      return arbitrary.array(gen.arbitrary, size);
    },

    shrink: shrink.array.bind(null, gen.shrink),
    show: show.array.bind(null, gen.show),
  };
}

/**
  #### pair (a : generator A) (b : generator B) : generator (A * B)

  If not specified `a` and `b` are equal to `value()`.
*/
function pair(a, b) {
  a = generator.force(a || primitive.value);
  b = generator.force(b || primitive.value);

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

/**
  #### map (gen : generator A) : generator (map A)

  Generates a javascript object with properties of type `A`.
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

function map(gen) {
  gen = generator.force(gen || primitive.value());
  var pairGenerator = pair(primitive.string(), gen);
  var arrayGenerator = array(pairGenerator);

  return {
    arbitrary: function (size) {
      var arrayOfPairs =  arrayGenerator.arbitrary(size);
      return fromArray(arrayOfPairs);
    },
    shrink: function (m) {
      var arrayOfPairs = toArray(m);
      var shrinked = arrayGenerator.shrink(arrayOfPairs);
      return shrinked.map(fromArray);
    },
    show: function (m) {
      return "{" + Object.keys(m).map(function (k) {
        return k + ": " + gen.show(m[k]);
      }).join(", ") + "}";
    }
  };
}

/**
  #### record (spec : {a: generator...}) : generator (record {a: generator...})

  Generates a javascript object with given record spec.
*/
function record(spec) {
  return {
    arbitrary: function (size) {
      var res = {};
      Object.keys(spec).forEach(function (k) {
        var gen = generator.force(spec[k]);
        res[k] = gen.arbitrary(size);
      });
      return res;
    },
    shrink: shrink.noop,
    show: function (m) {
      return "{" + Object.keys(m).map(function (k) {
        var gen = generator.force(spec[k]);
        return k + ": " + gen.show(m[k]);
      }).join(", ") + "}";
    }
  };
}

module.exports = {
  pair: pair,
  array: array,
  map: map,
  record: record,
};
