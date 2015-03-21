/* @flow weak */
"use strict";

var random = require("./random.js");
var either = require("./either.js");
var utils = require("./utils.js");

/**
  ### Generator functions

  A generator function, `generator a`, is a function `(size: nat) -> a`, which generates a value of given size.

  Generator combinators are auto-curried:

  ```js
  var xs = generator.array(shrink.nat, 1); // ≡
  var ys = generator.array(shrink.nat)(1);
  ```

  In purely functional approach `generator a` would be explicitly stateful computation:
  `(size: nat, rng: randomstate) -> (a, randomstate)`.
  *JSVerify* uses an implicit random number generator state,
  but the value generation is deterministic (tests reproduceable),
  if the primitives from *random* module are used.
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

/**
  - `generator.bless(f: nat -> a): generator a`

      Bless function with `.map` and `.flatmap` properties.

  - `.map(f: a -> b): generator b`

      Map `generator a` into `generator b`. For example:

      ```js
      positiveIntegersGenerator = nat.generator.map(
        function (x) { return x + 1; });
      ```

  - `.isomap(f: a -> generator b): generator b`

      Monadic bind for generators.
*/
function generatorBless(generator) {
  generator.map = generatorProtoMap;
  generator.flatmap = generatorProtoFlatMap;
  return generator;
}

/**
  - `generator.constant(x: a): generator a`
*/
function generateConstant(x) {
  return generatorBless(function () {
    return x;
  });
}

/**
  - `generator.combine(gen: generator a..., f: a... -> b): generator b`
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
  - `generator.oneof(gens: list (generator a)): generator a`
*/
function generateOneof(generators) {
  var result = generatorBless(function (size) {
    var idx = random(0, generators.length - 1);
    var arb = generators[idx];
    return arb(size);
  });

  return utils.curried2(result, arguments);
}

// Helper, essentially: log2(size + 1)
function logsize(size) {
  return Math.max(Math.round(Math.log(size + 1) / Math.log(2), 0));
}

/**
  - `generator.recursive(genZ: generator a, genS: generator a -> generator a): generator a`
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
  - `generator.pair(genA: generator a, genB: generator b): generator (a, b)`
*/
function generatePair(genA, genB) {
  var result = generatorBless(function (size) {
    return [genA(size), genB(size)];
  });

  return utils.curried3(result, arguments);
}

/**
  - `generator.either(genA: generator a, genB: generator b): generator (either a b)`
*/
function generateEither(genA, genB) {
  var result = generatorBless(function (size) {
    var n = random(0, 1);
    switch (n) {
      case 0: return either.left(genA(size));
      case 1: return either.right(genB(size));
    }
  });

  return utils.curried3(result, arguments);
}
/**
  - `generator.unit: generator ()

      `unit` is an empty tuple, i.e. empty array in JavaScript representation. This is useful as a building block.
*/
function generateUnit() {
  return [];
}

/**
  - `generator.tuple(gens: (generator a, generator b...): generator (a, b...)`
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
   - `generator.array(gen: generator a): generator (array a)`
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
   - `generator.nearray(gen: generator a): generator (array a)`
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
  - `generator.char: generator char`
*/
var generateChar = generatorBless(function generateChar(/* size */) {
  return String.fromCharCode(random(0, 0xff));
});

/**
  - `generator.string: generator string`
*/
var generateString = generateArray(generateChar).map(utils.charArrayToString);

/**
  - `generator.nestring: generator string`
*/
var generateNEString = generateNEArray(generateChar).map(utils.charArrayToString);

/**
  - `generator.asciichar: generator char`
*/
var generateAsciiChar = generatorBless(function generateAsciiChar(/* size */) {
  return String.fromCharCode(random(0x20, 0x7e));
});

/**
  - `generator.asciistring: generator string`
*/
var generateAsciiString = generateArray(generateAsciiChar).map(utils.charArrayToString);

/**
  - `generator.map(gen: generator a): generator (map a)`
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
  - `generator.json: generator json`
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
  pair: generatePair,
  either: generateEither,
  unit: generateUnit,
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
