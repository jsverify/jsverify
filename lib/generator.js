"use strict";

var random = require("./random.js");
var utils = require("./utils.js");

/**
    ### Generator functions
*/

// Blessing: i.e adding prototype
/* eslint-disable no-use-before-define */
function generatorProtoMap(f) {
  /* jshint validthis:true */
  var generator = this;
  return generatorBless(function (size) {
    return f(generator(size));
  });
}

function generatorProtoFlatMap(f) {
  /* jshint validthis:true */
  var generator = this;
  return generatorBless(function (size) {
    return f(generator(size))(size);
  });
}
/* eslint-enable no-use-before-define */

function generatorBless(generator) {
  generator.map = generatorProtoMap;
  generator.flatmap = generatorProtoFlatMap;
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

// Helper, essentially: log2(size + 1)
function logsize(size) {
  return Math.max(Math.round(Math.log(size + 1) / Math.log(2), 0));
}

/**
  - `generator.tuple(gens: (gen a, gen b...), size: nat): gen (a, b...)`
*/
function generateTuple(gens) {
  var len = gens.length;
  var result = generatorBless(function (size) {
    var r = [];
    for (var i = 0; i < len; i++) {
      r[i] = gens[i](size);
    }
    return r;
  });

  return utils.curried2(result, arguments);
}

/**
   - `generator.array(gen: gen a, size: nat): gen (array a)`
*/
function generateArray(gen) {
  var result = generatorBless(function (size) {
    var arrsize = random(0, logsize(size));
    var arr = new Array(arrsize);
    for (var i = 0; i < arrsize; i++) {
      arr[i] = gen(size);
    }
    return arr;
  });

  return utils.curried2(result, arguments);
}

/**
   - `generator.nearray(gen: Gen a, size: nat): gen (array a)`
*/
function generateNEArray(gen) {
  var result = generatorBless(function (size) {
    var arrsize = random(1, Math.max(logsize(size), 1));
    var arr = new Array(arrsize);
    for (var i = 0; i < arrsize; i++) {
      arr[i] = gen(size);
    }
    return arr;
  });

  return utils.curried2(result, arguments);
}

/**
  - `generator.char: gen char`
*/
var generateChar = generatorBless(function generateChar(/* size */) {
  return String.fromCharCode(random(0, 0xff));
});

/**
  - `generator.string(size: nat): gen string`
*/
var generateString = generateArray(generateChar).map(utils.charArrayToString);

/**
  - `generator.nestring(size: nat): gen string`
*/
var generateNEString = generateNEArray(generateChar).map(utils.charArrayToString);

/**
  - `generator.asciichar: gen char`
*/
var generateAsciiChar = generatorBless(function generateAsciiChar(/* size */) {
  return String.fromCharCode(random(0x20, 0x7e));
});

/**
  - `generator.asciistring(size: nat): gen string`
*/
var generateAsciiString = generateArray(generateAsciiChar).map(utils.charArrayToString);

/**
  - `generator.map(gen: gen a, size: nat): gen (map a)`
*/
function generateMap(gen) {
  var result = generatorBless(function (size) {
    var objsize = random(0, logsize(size));
    var obj = {};
    for (var i = 0; i < objsize; i++) {
      obj[generateString(size)] = gen(size);
    }
    return obj;
  });

  return utils.curried2(result, arguments);
}

/**
  - `generator.oneof(gen: list (gen a), size: nat): gen a`
*/
function generateOneof(generators) {
  var result = generatorBless(function (size) {
    var idx = random(0, generators.length - 1);
    var arb = generators[idx];
    return arb(size);
  });

  return utils.curried2(result, arguments);
}

/**
  - `generator.combine(gen: gen a..., f: a... -> b): gen b`
*/
function generatorCombine() {
  var generators = Array.prototype.slice.call(arguments, 0, -1);
  var f = arguments[arguments.length - 1];

  return generatorBless(function (size) {
    var values = generators.map(function (gen) {
      return gen(size);
    });

    return f.apply(undefined, values);
  });
}

/**
  - `generator.recursive(genZ: gen a, genS: gen a -> gen a): gen a<
*/
function generatorRecursive(genZ, genS) {
  return generatorBless(function (size) {
    function rec(n, sizep) {
      if (n <= 0 || random(0, 3) === 0) {
        return genZ(sizep);
      } else {
        return genS(generatorBless(function (sizeq) {
          return rec(n - 1, sizeq);
        }))(sizep);
      }
    }

    return rec(logsize(size), size);
  });
}

/**
  - `generator.json: gen json`
*/
var generateInteger = generatorBless(function (size) {
  return random(-size, size);
});

var generateNumber = generatorBless(function (size) {
  return random.number(-size, size);
});

var generateBool = generatorBless(function () {
  return random(0, 1) === 0;
});

var generateJson = generatorRecursive(
  generateOneof([generateInteger, generateNumber, generateBool, generateString]),
  function (gen) {
    return generateOneof([generateArray(gen), generateMap(gen)]);
  });

module.exports = {
  tuple: generateTuple,
  array: generateArray,
  nearray: generateNEArray,
  char: generateChar,
  string: generateString,
  nestring: generateNEString,
  asciichar: generateAsciiChar,
  asciistring: generateAsciiString,
  map: generateMap,
  json: generateJson,
  oneof: generateOneof,
  constant: generateConstant,
  bless: generatorBless,
  combine: generatorCombine,
  recursive: generatorRecursive,
};
