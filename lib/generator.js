"use strict";

var random = require("./random.js");

/**
    ### Generator functions
*/

// Blessing: i.e adding prototype
/* eslint-disable no-use-before-define */
function generatorProtoMap(generator) {
  return function (f) {
    return generatorBless(function (size) {
      return f(generator(size));
    });
  };
}
/* eslint-enable no-use-before-define */

function generatorBless(generator) {
  generator.map = generatorProtoMap(generator);
  return generator;
}

/**
  - `generator.constant(x: a): gen a`
*/
function generateConstant(x) {
  return generatorBless(function () {
    return x;
  });
}

/**
   - `generator.array(gen: Gen a, size: nat): gen (array a)`
*/
function generateArray(gen) {
  var result = generatorBless(function (size) {
    var arrsize = random(0, size);
    var arr = new Array(arrsize);
    for (var i = 0; i < arrsize; i++) {
      arr[i] = gen(size);
    }
    return arr;
  });

  if (arguments.length === 2) {
    return result(arguments[1]);
  } else {
    return result;
  }
}

/**
   - `generator.nearray(gen: Gen a, size: nat): gen (array a)`
*/
function generateNEArray(gen) {
  var result = generatorBless(function (size) {
    var arrsize = random(1, Math.max(size, 1));
    var arr = new Array(arrsize);
    for (var i = 0; i < arrsize; i++) {
      arr[i] = gen(size);
    }
    return arr;
  });

  if (arguments.length === 2) {
    return result(arguments[1]);
  } else {
    return result;
  }
}

/**
  - `generator.string(size: nat): gen string`
*/
function generateString(size) {
  return generateArray(function () {
    return String.fromCharCode(random(0, 0xff));
  }, size).join("");
}

/**
  - `generator.nestring(size: nat): gen string`
*/
function generateNEString(size) {
  return generateNEArray(function () {
    return String.fromCharCode(random(0, 0xff));
  }, size).join("");
}

/**
  - `generator.map(gen: gen a, size: nat): gen (map a)`
*/
function generateMap(gen) {
  var result = generatorBless(function (size) {
    var objsize = random(0, size);
    var obj = {};
    for (var i = 0; i < objsize; i++) {
      obj[generateString(size)] = gen(size);
    }
    return obj;
  });

  if (arguments.length === 2) {
    return result(arguments[1]);
  } else {
    return result;
  }
}

/**
  - `generator.json: gen json`
*/
var generateJson = generatorBless(function generateJson(size) {
  var type = random(0, 5);
  if (size === 0) {
    switch (type) {
      case 0: return 0;
      case 1: return random.number(0, 1);
      case 2: return random(0, 1) === 0;
      case 3: return "";
      case 4: return [];
      case 5: return {};
    }
  }

  // divide by 2
  size = size >> 1;

  switch (type) {
    case 0: return random(-size, size);
    case 1: return random.number(-size, size);
    case 2: return random(0, 1) === 0;
    case 3: return generateString(size);
    case 4: return generateArray(generateJson, size);
    case 5: return generateMap(generateJson, size);
  }
});

/**
  - `generator.oneof(gen: list (gen a), size: nat): gen a`
*/
function generateOneof(generators) {
  var result = generatorBless(function (size) {
    var idx = random(0, generators.length - 1);
    var arb = generators[idx];
    return arb(size);
  });

  if (arguments.length === 2) {
    return result(arguments[1]);
  } else {
    return result;
  }
}

module.exports = {
  array: generateArray,
  nearray: generateNEArray,
  string: generateString,
  nestring: generateNEString,
  map: generateMap,
  json: generateJson,
  oneof: generateOneof,
  constant: generateConstant,
  bless: generatorBless,
};
