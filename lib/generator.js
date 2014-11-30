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

function generatorProtoFlatMap(generator) {
  return function (f) {
    return generatorBless(function (size) {
      return f(generator(size))(size);
    });
  };
}
/* eslint-enable no-use-before-define */

function generatorBless(generator) {
  generator.map = generatorProtoMap(generator);
  generator.flatmap = generatorProtoFlatMap(generator);
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
   - `generator.array(gen: Gen a, size: nat): gen (array a)`
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
    var arrsize = random(1, Math.max(logsize(size), 1));
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
    var objsize = random(0, logsize(size));
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
  array: generateArray,
  nearray: generateNEArray,
  string: generateString,
  nestring: generateNEString,
  map: generateMap,
  json: generateJson,
  oneof: generateOneof,
  constant: generateConstant,
  bless: generatorBless,
  combine: generatorCombine,
  recursive: generatorRecursive,
};
