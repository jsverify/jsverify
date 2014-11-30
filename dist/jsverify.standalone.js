!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.jsc=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
    generator: generator.array(arb.generator),
    shrink: shrink.array(arb.shrink),
    show: show.array.bind(null, arb.show),
  };
}

/**
  - `nearray(arb: arbitrary a): arbitrary (array a)`
*/
function nearray(arb) {
  arb = utils.force(arb || primitive.json);

  return {
    generator: generator.nearray(arb.generator),
    shrink: shrink.nearray(arb.shrink),
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
    generator: generator.bless(function (size) {
      return [a.generator(size), b.generator(size)];
    }),

    shrink: shrink.tuple([a.shrink, b.shrink]),
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
  array: array,
  nearray: nearray,
  map: map,
  oneof: oneof,
  record: record,
};

},{"./generator.js":6,"./primitive.js":8,"./show.js":10,"./shrink.js":11,"./utils.js":14,"assert":15}],2:[function(require,module,exports){
"use strict";

var arbitrary = require("./arbitrary.js");
var fn = require("./fn.js");
var primitive = require("./primitive.js");
var utils = require("./utils.js");

var environment = utils.merge(primitive, {
  pair: arbitrary.pair,
  array: arbitrary.array,
  nearray: arbitrary.nearray,
  map: arbitrary.map,
  fn: fn.fn,
  fun: fn.fn,
  nonshrink: arbitrary.nonshrink,
});

module.exports = environment;

},{"./arbitrary.js":1,"./fn.js":4,"./primitive.js":8,"./utils.js":14}],3:[function(require,module,exports){
"use strict";

var utils = require("./utils.js");

/*
  #### FMap (eq : a -> a -> bool) : FMap a

  Finite map, with any object a key.

  Short summary of member functions:

  - FMap.insert (key : a) (value : any) : void
  - FMap.get (key : a) : any
  - FMap.contains (key : a) : obool
*/
function FMap(eq) {
  this.eq = eq || utils.isEqual;
  this.data = [];
}

FMap.prototype.contains = function FMapContains(key) {
  for (var i = 0; i < this.data.length; i++) {
    if (this.eq(this.data[i][0], key)) {
      return true;
    }
  }

  return false;
};

FMap.prototype.insert = function FMapInsert(key, value) {
  for (var i = 0; i < this.data.length; i++) {
    if (this.eq(this.data[i][0], key)) {
      this.data[i] = [key, value];
      return;
    }
  }

  this.data.push([key, value]);
};

FMap.prototype.get = function FMapGet(key) {
  for (var i = 0; i < this.data.length; i++) {
    if (this.eq(this.data[i][0], key)) {
      return this.data[i][1];
    }
  }
};

module.exports = FMap;

},{"./utils.js":14}],4:[function(require,module,exports){
"use strict";

var FMap = require("./finitemap.js");
var primitive = require("./primitive.js");
var shrink = require("./shrink.js");
var utils = require("./utils.js");

/**
  - `fn(gen: generator a): generator (b -> a)`
  - `fun(gen: generator a): generator (b -> a)`
      Unary functions.
*/

function fn(arb) {
  arb = utils.force(arb || primitive.json);

  return {
    generator: function (size) {
      var m = new FMap();

      var f = function (arg) {
        if (!m.contains(arg)) {
          var value = arb.generator(size);
          m.insert(arg, value);
        }

        return m.get(arg);
      };

      f.internalMap = m;
      return f;
    },

    shrink: shrink.noop,
    show: function (f) {
      return "[" + f.internalMap.data.map(function (item) {
        return "" + item[0] + ": " + arb.show(item[1]);
      }).join(", ") + "]";
    }
  };
}

module.exports = {
  fn: fn,
  fun: fn,
};

},{"./finitemap.js":3,"./primitive.js":8,"./shrink.js":11,"./utils.js":14}],5:[function(require,module,exports){
"use strict";

/**
  #### isPromise p : bool

  Optimistic duck-type check for promises.
  Returns `true` if p is an object with `.then` function property.
*/
function isPromise(p) {
  /* eslint-disable no-new-object */
  return new Object(p) === p && typeof p.then === "function";
  /* eslint-enable non-new-object */
}

/**
  #### map (Functor f) => (p : f a) (g : a -> b) : f b

  This is functor map, known as `map` or `fmap`.
  Essentially `f(p)`. If `p` is promise, returns new promise.
  Using `map` makes code look very much [CPS-style](http://en.wikipedia.org/wiki/Continuation-passing_style).
*/
function map(p, g) {
  if (isPromise(p)) {
    return p.then(g);
  } else {
    return g(p);
  }
}

/**
  #### bind (Functor f) => (k : a -> f b) (xs : a) (h : b -> f c) -> f c

  This is almost monadic bind.
*/
function bind(f, xs, h) {
  var r;
  var exc;
  try {
    r = f.apply(undefined, xs);
  } catch (e) {
    r = false;
    exc = e;
  }

  if (isPromise(r)) {
    return r.then(
      h,
      function (e) {
        // exc is always unset here
        return h(false, e);
      }
    );
  } else {
    return h(r, exc);
  }
}

module.exports = {
  isPromise: isPromise,
  map: map,
  bind: bind,
};

},{}],6:[function(require,module,exports){
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

},{"./random.js":9}],7:[function(require,module,exports){
/**
  # JSVerify

  <img src="https://raw.githubusercontent.com/jsverify/jsverify/master/jsverify-300.png" align="right" height="100" />

  > Property based checking.

  [![Build Status](https://secure.travis-ci.org/jsverify/jsverify.svg?branch=master)](http://travis-ci.org/jsverify/jsverify)
  [![NPM version](https://badge.fury.io/js/jsverify.svg)](http://badge.fury.io/js/jsverify)
  [![Dependency Status](https://david-dm.org/jsverify/jsverify.svg)](https://david-dm.org/jsverify/jsverify)
  [![devDependency Status](https://david-dm.org/jsverify/jsverify/dev-status.svg)](https://david-dm.org/jsverify/jsverify#info=devDependencies)
  [![Code Climate](https://img.shields.io/codeclimate/github/jsverify/jsverify.svg)](https://codeclimate.com/github/jsverify/jsverify)

  ## Getting Started

  Install the module with: `npm install jsverify`

  ## Synopsis

  ```js
  var jsc = require("jsverify");

  // forall (f : bool -> bool) (b : bool), f (f (f b)) = f(b).
  var boolFnAppliedThrice =
    jsc.forall("bool -> bool", "bool", function (f, b) {
      return f(f(f(b))) === f(b);
    });

  jsc.assert(boolFnAppliedThrice);
  // OK, passed 100 tests
  ```
*/
  "use strict";

/**
  ## Documentation

  ### Usage with [mocha](http://visionmedia.github.io/mocha/)

  Using jsverify with mocha is easy, just define the properties and use `jsverify.assert`.

  Starting from version 0.4.3 you can write your specs without any boilerplate:

  ```js
  describe("sort", function () {
    jsc.property("idempotent", "array nat", function (arr) {
      return _.isEqual(sort(sort(arr)), sort(arr));
    });
  });
  ```

  You can also provide `--jsverifyRngState state` command line argument, to run tests with particular random generator state.

  ```
  $ mocha examples/nat.js

  1) natural numbers are less than 90:
   Error: Failed after 49 tests and 1 shrinks. rngState: 074e9b5f037a8c21d6; Counterexample: 90;

  $ mocha examples/nat.js --grep 'are less than' --jsverifyRngState 074e9b5f037a8c21d6

  1) natural numbers are less than 90:
     Error: Failed after 1 tests and 1 shrinks. rngState: 074e9b5f037a8c21d6; Counterexample: 90;
  ```

  Errorneous case is found with first try.

  ### Usage with [jasmine](http://pivotal.github.io/jasmine/)

  Check [jasmineHelpers.js](helpers/jasmineHelpers.js) and [jasmineHelpers2.js](helpers/jasmineHelpers2.js) for jasmine 1.3 and 2.0 respectively.

  ## API

  > _Testing shows the presence, not the absence of bugs._
  >
  > Edsger W. Dijkstra

  To show that propositions hold, we need to construct proofs.
  There are two extremes: proof by example (unit tests) and formal (machine-checked) proof.
  Property-based testing is somewhere in between.
  We formulate propositions, invariants or other properties we believe to hold, but
  only test it to hold for numerous (randomly generated) values.

  Types and function signatures are written in [Coq](http://coq.inria.fr/)/[Haskell](http://www.haskell.org/haskellwiki/Haskell) influented style:
  C# -style `List<T> filter(List<T> v, Func<T, bool> predicate)` is represented by
  `filter (v : array T) (predicate : T -> bool) : array T` in our style.

  `jsverify` can operate with both synchronous and asynchronous-promise properties.
  Generally every property can be wrapped inside [functor](http://learnyouahaskell.com/functors-applicative-functors-and-monoids),
  for now in either identity or promise functor, for synchronous and promise properties respectively.
*/

var assert = require("assert");

var arbitrary = require("./arbitrary.js");
var environment = require("./environment.js");
var FMap = require("./finitemap.js");
var fn = require("./fn.js");
var functor = require("./functor.js");
var generator = require("./generator.js");
var primitive = require("./primitive.js");
var random = require("./random.js");
var show = require("./show.js");
var shrink = require("./shrink.js");
var suchthat = require("./suchthat.js");
var typify = require("./typify.js");
var utils = require("./utils.js");

/**
  ### Properties
*/

function shrinkResult(gens, x, test, size, shrinks, exc, transform) {
  var shrinked = shrink.tuple(utils.pluck(gens, "shrink"), x);
  var shrinkP = shrinked.reduce(function (res, y) {
    return functor.map(res, function (resPrime) {
      if (resPrime !== true) {
        return resPrime;
      }

      return test(size, y, shrinks + 1);
    });
  }, true);

  return functor.map(shrinkP, function (shrinkPPrime) {
    if (shrinkPPrime === true) {
      var res = {
        counterexample: x,
        counterexamplestr: show.tuple(utils.pluck(gens, "show"), x),
        shrinks: shrinks,
        exc: exc,
      };
      return transform ? transform(res) : res;
    } else {
      return shrinkPPrime;
    }
  });
}

function isArbitrary(arb) {
  return typeof arb === "object" &&
    typeof arb.generator === "function" &&
    typeof arb.shrink === "function" &&
    typeof arb.show === "function";
}

/**
  - `forall(arbs: arbitrary a ..., userenv: (map arbitrary)?, prop : a -> property): property`

      Property constructor
*/
function forall() {
  var args = Array.prototype.slice.call(arguments);
  var gens = args.slice(0, -1);
  var property = args[args.length - 1];
  var env;

  var lastgen = gens[gens.length - 1];
  if (!isArbitrary(lastgen) && typeof lastgen !== "string") {
    env = utils.merge(environment, lastgen);
    gens = gens.slice(0, -1);
  } else {
    env = environment;
  }

  // Map typify-dsl to hard generators
  gens = gens.map(function (g) {
    g = typeof g === "string" ? typify.parseTypify(env, g) : g;
    return utils.force(g);
  });

  assert(typeof property === "function", "property should be a function");

  function test(size, x, shrinks) {
    assert(Array.isArray(x), "generators results should be always tuple");
    shrinks = shrinks || 0;

    return functor.bind(property, x, function (r, exc) {
      if (r === true) { return true; }
      if (typeof r === "function") {
        var rRec = r(size);

        return functor.map(rRec, function (rRecPrime) {
          if (rRecPrime === true) {
            return true;
          } else {
            return shrinkResult(gens, x, test, size, shrinks, exc, function (r) {
              return {
                counterexample: r.counterexample.concat(rRecPrime.counterexample),
                counterexamplestr: r.counterexamplestr ,//+ "; " + rRec.counterexamplestr,
                shrinks: r.shrinks,
                exc: r.exc || rRecPrime.exc,
              };
            });
          }
        });
      }

      return shrinkResult(gens, x, test, size, shrinks, exc);
    });
  }

  return function (size) {
    var x = gens.map(function (arb) { return arb.generator(size); });
    var r = test(size, x);
    return r;
  };
}

function formatFailedCase(r, state) {
  var msg = "Failed after " + r.tests + " tests and " + r.shrinks + " shrinks. ";
  msg += "rngState: " + (r.rngState || state) + "; ";
  msg += "Counterexample: " + r.counterexamplestr + "; ";
  if (r.exc) {
    msg += "Exception: " + (r.exc instanceof Error ? r.exc.message : r.exc);
  }
  return msg;
}

function findRngState(argv) {
  for (var i = 0; i < argv.length - 1; i++) {
    if (argv[i] === "--jsverifyRngState") {
      return argv[i + 1];
    }
  }
}

/**
  - `check (prop: property, opts: checkoptions?): result`

      Run random checks for given `prop`. If `prop` is promise based, result is also wrapped in promise.

      Options:
      - `opts.tests` - test count to run, default 100
      - `opts.size`  - maximum size of generated values, default 5

      - `opts.quiet` - do not `console.log`
      - `opts.rngState` - state string for the rng
*/
function check(property, opts) {
  opts = opts || {};
  opts.size = opts.size || 50;
  opts.tests = opts.tests || 100;
  opts.quiet = opts.quiet || false;

  assert(typeof property === "function", "property should be a function");

  var state;

  if (opts.rngState) {
    random.setStateString(opts.rngState);
  } else if (typeof process !== "undefined") {
    var argvState = findRngState(process.argv);
    if (argvState) {
      random.setStateString(argvState);
    }
  }

  function loop(i) {
    state = random.currentStateString();
    if (i > opts.tests) {
      return true;
    }

    var size = random(0, opts.size);

    var r = property(size);
    return functor.map(r, function (rPrime) {
      if (rPrime === true) {
        return loop(i + 1);
      } else {
        rPrime.tests = i;
        /* global console */
        if (!opts.quiet) {
          console.error(formatFailedCase(rPrime, state), rPrime.counterexample);
        }
        return rPrime;
      }
    });
  }

  return functor.map(loop(1), function (r) {
    if (r === true) {
      if (!opts.quiet) { console.info("OK, passed " + opts.tests + " tests"); }
    } else {
      r.rngState = state;
    }

    return r;
  });
}

/**
  - `assert(prop: property, opts: checkoptions?) : void`

      Same as `check`, but throw exception if property doesn't hold.
*/
function checkThrow(property, opts) {
  opts = opts || {};
  if (opts.quiet === undefined) {
    opts.quiet = true;
  }

  return functor.map(check(property, opts), function (r) {
    if (r !== true) {
      throw new Error(formatFailedCase(r));
    }
  });
}

/**
   - `property(name: string, ...)

      Assuming there is globally defined `it`, the same as:

      ```js
      it(name, function () {
        jsc.assert(jsc.forall(...));
      }
      ```

      You can use `property` to write facts too:
      ```js
      jsc.property("+0 === -0", function () {
        return +0 === -0;
      });
      ```
*/
function bddProperty(name) {
  /* global it: true */
  var args = Array.prototype.slice.call(arguments, 1);
  if (args.length === 1) {
    it(name, function () {
      if (args[0]() !== true) {
        throw new Error(name + " doesn't hold");
      }
    });
  } else {
    var prop = forall.apply(undefined, args);
    it(name, function () {
      checkThrow(prop);
    });
  }
  /* global it: false */
}

/**
  - `sampler(arb: arbitrary a, genSize: nat = 10): (sampleSize: nat?) -> a`

      Create a sampler for a given arbitrary with an optional size. Handy when used in
      a REPL:
      ```
      > jsc = require('jsverify') // or require('./lib/jsverify') w/in the project
      ...
      > jsonSampler = jsc.sampler(jsc.json, 4)
      [Function]
      > jsonSampler()
      0.08467432763427496
      > jsonSampler()
      [ [ [] ] ]
      > jsonSampler()
      ''
      > sampledJson(2)
      [-0.4199344692751765, false]
      ```
*/
function sampler(arb, size) {
  size = typeof size === "number" ? Math.abs(size) : 10;
  return function (count) {
    if (typeof count === "number") {
      var acc = [];
      count = Math.abs(count);
      for (var i = 0; i < count; i++) {
        acc.push(arb.generator(size));
      }
      return acc;
    } else {
      return arb.generator(size);
    }
  };
}

/**
  ### Types

  - `generator a` is a function `(size: nat) -> a`.
  - `show` is a function `a -> string`.
  - `shrink` is a function `a -> [a]`, returning *smaller* values.
  - `arbitrary a` is a triple of generator, shrink and show functions.
      - `{ generator: nat -> a, shrink : a -> array a, show: a -> string }`
*/

/// include ./typify.js
/// include ./primitive.js
/// include ./arbitrary.js
/// include ./fn.js
/// include ./generator.js
/// include ./shrink.js
/// include ./show.js
/// include ./random.js
/// include ./utils.js

// Export
var jsc = {
  forall: forall,
  check: check,
  assert: checkThrow,
  property: bddProperty,
  sampler: sampler,

  // generators
  pair: arbitrary.pair,
  array: arbitrary.array,
  nearray: arbitrary.nearray,
  map: arbitrary.map,
  oneof: arbitrary.oneof,
  record: arbitrary.record,
  nonshrink: arbitrary.nonshrink,
  fn: fn.fn,
  fun: fn.fn,
  suchthat: suchthat.suchthat,
  value: primitive.json,

  // compile
  compile: function (str, env) {
    env = env ? utils.merge(environment, env) : environment;
    return typify.parseTypify(env, str);
  },

  // internal utility lib
  random: random,
  shrink: shrink,
  show: show,
  generator: generator,
  utils: utils,
  _: {
    FMap: FMap,
  },
};

/* primitives */
for (var k in primitive) {
  jsc[k] = primitive[k];
}

module.exports = jsc;

/// plain ../CONTRIBUTING.md
/// plain ../CHANGELOG.md
/// plain ../related-work.md
/// plain ../LICENSE

},{"./arbitrary.js":1,"./environment.js":2,"./finitemap.js":3,"./fn.js":4,"./functor.js":5,"./generator.js":6,"./primitive.js":8,"./random.js":9,"./show.js":10,"./shrink.js":11,"./suchthat.js":12,"./typify.js":13,"./utils.js":14,"assert":15}],8:[function(require,module,exports){
"use strict";

var assert = require("assert");
var generator = require("./generator.js");
var random = require("./random.js");
var show = require("./show.js");
var shrink = require("./shrink.js");
var utils = require("./utils.js");

/**
  ### Primitive arbitraries
*/

function extendWithDefault(arb) {
  var def = arb();
  arb.generator = def.generator;
  arb.shrink = def.shrink;
  arb.show = def.show;
}

/**
  - `integer: arbitrary integer`
  - `integer(maxsize: nat): arbitrary integer`
  - `integer(minsize: integer, maxsize: integer): arbitrary integer`

      Integers, ℤ
*/
function integer(minsize, maxsize) {
  if (arguments.length === 2) {
    var arb = integer(maxsize - minsize);
    var to = function to(x) {
      return Math.abs(x) + minsize;
    };
    var from = function from(x) {
      return x - minsize;
    };

    return {
      generator: arb.generator.map(to),
      shrink: arb.shrink.isomap(to, from),
      show: show.def,
    };
  } else if (arguments.length === 1) {
    maxsize = minsize;
  }

  return {
    generator: generator.bless(function (size) {
      size = maxsize || size;
      return random(-size, size);
    }),
    shrink: shrink.bless(function (i) {
      i = Math.abs(i);
      if (i === 0) {
        return [];
      } else {
        var arr = [0];
        var j = utils.div2(i);
        var k = Math.max(j, 1);
        while (j < i) {
          arr.push(j);
          arr.push(-j);
          k = Math.max(utils.div2(k), 1);
          j += k;
        }
        return arr;
      }
    }),

    show: show.def,
  };
}

extendWithDefault(integer);

/**
  - `nat: arbitrary nat`
  - `nat(maxsize: nat): arbitrary nat`

      Natural numbers, ℕ (0, 1, 2...)
*/
function nat(maxsize) {
  return {
    generator: generator.bless(function (size) {
      size = maxsize || size;
      return random(0, size);
    }),
    shrink: shrink.bless(function (i) {
      var arr = [];
      var j = utils.div2(i);
      var k = Math.max(j, 1);
      while (j < i) {
        arr.push(j);
        k = Math.max(utils.div2(k), 1);
        j += k;
      }
      return arr;
    }),
    show: show.def,
  };
}

extendWithDefault(nat);

/**
  - `number: arbitrary number`
  - `number(maxsize: number): arbitrary number`
  - `number(min: number, max: number): arbitrary number`

      JavaScript numbers, "doubles", ℝ. `NaN` and `Infinity` are not included.
*/
function number(minsize, maxsize) {
  if (arguments.length === 2) {
    var arb = number(maxsize - minsize);
    var to = function to(x) {
      return Math.abs(x) + minsize;
    };
    var from = function from(x) {
      return x - minsize;
    };

    return {
      generator: arb.generator.map(to),
      shrink: arb.shrink.isomap(to, from),
      show: show.def,
    };
  } else if (arguments.length === 1) {
    maxsize = minsize;
  }

  return {
    generator: generator.bless(function (size) {
      size = maxsize || size;
      return random.number(-size, size);
    }),
    shrink: shrink.bless(function (x) {
      if (Math.abs(x) > 1e-6) {
        return [0, x / 2, -x / 2];
      } else {
        return [];
      }
    }),
    show: show.def,
  };
}

extendWithDefault(number);

/**
  - `uint8: arbitrary nat`
  - `uint16: arbitrary nat`
  - `uint32: arbitrary nat`
*/
var uint8 = nat(0xff);
var uint16 = nat(0xffff);
var uint32 = nat(0xffffffff);

/**
  - `int8: arbitrary integer`
  - `int16: arbitrary integer`
  - `int32: arbitrary integer`
*/
var int8 = integer(0x80);
var int16 = integer(0x8000);
var int32 = integer(0x80000000);

/**
  - `bool: generator bool`

      Booleans, `true` or `false`.
*/
var bool = {
  generator: generator.bless(function (/* size */) {
    var i = random(0, 1);
    return i === 0 ? false : true;
  }),

  shrink: shrink.bless(function (b) {
    return b === true ? [false] : [];
  }),
  show: show.def,
};

/**
  - `datetime: generator datetime`

      Random datetime
*/
var datetimeConst = 1416499879495; // arbitrary datetime

function datetime(from, to) {
  var toDate;
  var fromDate;
  var arb;

  if (arguments.length === 2) {
    toDate = function toDate(x) {
      return new Date(x);
    };
    fromDate = function fromDate(x) {
      return x.getTime();
    };
    from = fromDate(from);
    to = fromDate(to);
    arb = number(from, to);

    return {
      generator: arb.generator.map(toDate),
      shrink: arb.shrink.isomap(toDate, fromDate),
      show: show.def,
    };
  } else {
    toDate = function toDate(x) {
      return new Date(x * 768000000 + datetimeConst);
    };
    arb = number;

    return {
      generator: arb.generator.map(toDate),
      shrink: shrink.noop,
      show: show.def,
    };
  }
}

extendWithDefault(datetime);

/**
  - `elements(args: array a): generator a`

      Random element of `args` array.
*/
function elements(args) {
  assert(args.length !== 0, "elements: at least one parameter expected");

  return {
    generator: generator.bless(function (/* size */) {
      var i = random(0, args.length - 1);
      return args[i];
    }),

    shrink: function (x) {
      var idx = args.indexOf(x);
      if (idx <= 0) {
        return [];
      } else {
        return args.slice(0, idx);
      }
    },
    show: show.def,
  };
}

function natToChar(n) {
  return String.fromCharCode(n);
}

/**
  - `char: generator char`

      Single character
*/
var natChar = nat(0x1ff);

var char = {
  generator: natChar.generator.map(natToChar),
  shrink: shrink.noop,
  show: show.def,
};

function natToAsciiChar(n) {
  return String.fromCharCode(n + 0x20);
}

/**
  - `asciichar: generator char`

      Single ascii character (0x20-0x7e inclusive, no DEL)
*/
var natAsciiChar = nat(0x77 - 0x20);

var asciichar = {
  generator: natAsciiChar.generator.map(natToAsciiChar),
  shrink: shrink.noop,
  show: show.def,
};

function arrayToString(arr) {
  return arr.join("");
}

function stringToArray(str) {
  return str.split("");
}

/**
  - `string: generator string`
*/
function string() {
  return {
    generator: generator.string,
    shrink: shrink.array(char.shrink).isomap(arrayToString, stringToArray),
    show: show.def,
  };
}

extendWithDefault(string);

/**
  - `notEmptyString: arbitrary string`

      Generates strings which are not empty.
*/
var nestring = {
  generator: generator.nestring,
  shrink: shrink.nearray(asciichar.shrink).isomap(arrayToString, stringToArray),
  show: show.def,
};

/**
  - `asciistring: generator string`
*/
var asciistring = {
  generator: generator.bless(function (size) {
    return generator.array(asciichar.generator, size).join("");
  }),
  shrink: shrink.array(asciichar.shrink).isomap(arrayToString, stringToArray),
  show: show.def,
};

/**
  - `json: generator json`

       JavaScript Objects: boolean, number, string, array of `json` values or object with `json` values.

  - `value: generator json`
*/
var json = {
  generator: generator.json,
  shrink: shrink.noop,
  show: function (v) {
    return JSON.stringify(v);
  },
};

/**
  - `falsy: arbitrary *`

      Generates falsy values: `false`, `null`, `undefined`, `""`, `0`, and `NaN`.
*/
var falsy = elements([false, null, undefined, "", 0, NaN]);
falsy.show = function (v) {
  if (v !== v) {
    return "falsy: NaN";
  } else if (v === "") {
    return "falsy: empty string";
  } else if (v === undefined) {
    return "falsy: undefined";
  } else {
    return "falsy: " + v;
  }
};

/**
  - `constant(x: a): arbitrary a`

      Returns an unshrinkable arbitrary that yields the given object.
*/
function constant(x) {
  return {
    generator: generator.constant(x),
    shrink: shrink.noop,
    show: show.def
  };
}

module.exports = {
  integer: integer,
  nat: nat,
  int8: int8,
  int16: int16,
  int32: int32,
  uint8: uint8,
  uint16: uint16,
  uint32: uint32,
  number: number,
  json: json,
  char: char,
  string: string,
  asciichar: asciichar,
  asciistring: asciistring,
  elements: elements,
  bool: bool,
  falsy: falsy,
  constant: constant,
  nestring: nestring,
  datetime: datetime,
};

},{"./generator.js":6,"./random.js":9,"./show.js":10,"./shrink.js":11,"./utils.js":14,"assert":15}],9:[function(require,module,exports){
"use strict";

var rc4 = new (require("rc4").RC4small)();

/**
  ### Random functions
*/

/**
  - `random(min: int, max: int): int`

      Returns random int from `[min, max]` range inclusively.

      ```js
      getRandomInt(2, 3) // either 2 or 3
      ```
*/
function randomInteger(min, max) {
  return rc4.random(min, max);
}

/**
  - `random.number(min: number, max: number): number`

      Returns random number from `[min, max)` range.
*/
function randomNumber(min, max) {
  return rc4.randomFloat() * (max - min) + min;
}

randomInteger.integer = randomInteger;
randomInteger.number = randomNumber;

randomInteger.currentStateString = rc4.currentStateString.bind(rc4);
randomInteger.setStateString = rc4.setStateString.bind(rc4);

module.exports = randomInteger;

},{"rc4":19}],10:[function(require,module,exports){
"use strict";

/**
  ### Show functions
*/

/**
  - `show.def(x : a): string`
*/
function showDef(obj) {
  return "" + obj;
}

/**
  - `show.tuple(shrinks: (a -> string, b -> string...), x: (a, b...)): string`
*/
function showTuple(shows, objs) {
  var strs = [];
  for (var i = 0; i < shows.length; i++) {
    strs.push(shows[i](objs[i]));
  }
  return strs.join("; ");
}

/**
  - `show.array(shrink: a -> string, x: array a): string`
*/
function showArray(show, arr) {
  return "[" + arr.map(show).join(", ") + "]";
}

module.exports = {
  def: showDef,
  tuple: showTuple,
  array: showArray,
};

},{}],11:[function(require,module,exports){
"use strict";

var assert = require("assert");

/**
  ### Shrink functions
*/

// Blessing: i.e adding prototype
/* eslint-disable no-use-before-define */
function shrinkProtoIsoMap(shrink) {
  return function (f, g) {
    return shrinkBless(function (value) {
      return shrink(g(value)).map(f);
    });
  };
}
/* eslint-enable no-use-before-define */

function shrinkBless(shrink) {
  shrink.isomap = shrinkProtoIsoMap(shrink);
  return shrink;
}

/**
  - `shrink.noop(x: a): array a`
*/
var shrinkNoop = shrinkBless(function shrinkNoop() {
  return [];
});

/**
  - `shrink.tuple(shrinks: (a -> array a, b -> array b...), x: (a, b...)): array (a, b...)`
*/
function shrinkTuple(shrinks) {
  var result = shrinkBless(function (tup) {
    assert(shrinks.length === tup.length, "there should be as much shrinks as values in the tuple");

    var shrinked = new Array(tup.length);

    for (var i = 0; i < tup.length; i++) {
      /* jshint -W083 */
      /* eslint-disable no-loop-func */
      shrinked[i] = shrinks[i](tup[i]).map(function (x) {
        var c = tup.slice(); // clone array
        c[i] = x;
        return c;
      });
      /* eslint-enable no-loop-func */
      /* jshint +W083 */
    }

    return Array.prototype.concat.apply([], shrinked);
  });

  if (arguments.length === 2) {
    return result(arguments[1]);
  } else {
    return result;
  }
}

/**
  - `shrink.array(shrink: a -> array a, x: array a): array (array a)`
*/
function shrinkArray(shrink) {
  var result = shrinkBless(function (arr) {
    if (arr.length === 0) {
      return [];
    } else {
      var x = arr[0];
      var xs = arr.slice(1);

      return [xs].concat(
        shrink(x).map(function (xp) { return [xp].concat(xs); }),
        shrinkArray(shrink, xs).map(function (xsp) { return [x].concat(xsp); })
      );
    }
  });

  if (arguments.length === 2) {
    return result(arguments[1]);
  } else {
    return result;
  }
}

/**
  - `shrink.nearray(shrink: a -> nearray a, x:  nearray a): array (nearray a)`
*/
function shrinkNEArray(shrink) {
  var result = shrinkBless(function (arr) {
    if (arr.length <= 1) {
      return [];
    } else {
      var x = arr[0];
      var xs = arr.slice(1);

      return [xs].concat(
        shrink(x).map(function (xp) { return [xp].concat(xs); }),
        shrinkArray(shrink, xs).map(function (xsp) { return [x].concat(xsp); })
      );
    }
  });

  if (arguments.length === 2) {
    return result(arguments[1]);
  } else {
    return result;
  }
}

/**
  - `shrink.record(shrinks: { key: a -> string... }, x: { key: a... }): array { key: a... }`
*/
function shrinkRecord(shrinksRecord) {
  var result = shrinkBless(function (record) {
    var keys = Object.keys(record);
    var values = keys.map(function (k) { return record[k]; });
    var shrinks = keys.map(function (k) { return shrinksRecord[k]; });

    var shrinked = shrinkTuple(shrinks, values);

    return shrinked.map(function (s) {
      var res = {};
      keys.forEach(function (k, i) {
        res[k] = s[i];
      });
      return res;
    });
  });

  if (arguments.length === 2) {
    return result(arguments[1]);
  } else {
    return result;
  }
}

module.exports = {
  noop: shrinkNoop,
  tuple: shrinkTuple,
  array: shrinkArray,
  nearray: shrinkNEArray,
  record: shrinkRecord,
  bless: shrinkBless,
};

},{"assert":15}],12:[function(require,module,exports){
"use strict";

var environment = require("./environment.js");
var typify = require("./typify.js");
var utils = require("./utils.js");
var generator = require("./generator.js");
var shrink = require("./shrink.js");

/**
  - `suchthat(arb: arbitrary a, p : a -> bool): arbitrary a`
      Arbitrary of values that satisfy `p` predicate. It's advised that `p`'s accept rate is high.
*/
function suchthat(arb, userenv, predicate) {
  var env;
  if (arguments.length === 2) {
    predicate = userenv;
    env = environment;
  } else {
    env = utils.merge(environment, userenv);
  }

  arb = typeof arb === "string" ? typify.parseTypify(env, arb) : arb;
  arb = utils.force(arb);

  return {
    generator: generator.bless(function (size) {
      for (var i = 0; ; i++) {
        // if 5 tries failed, increase size
        if (i > 5) {
          i = 0;
          size += 1;
        }

        var x = arb.generator(size);
        if (predicate(x)) {
          return x;
        }
      }
    }),

    shrink: shrink.bless(function (x) {
      return arb.shrink(x).filter(predicate);
    }),

    show: arb.show,
  };
}

module.exports = {
  suchthat: suchthat,
};

},{"./environment.js":2,"./generator.js":6,"./shrink.js":11,"./typify.js":13,"./utils.js":14}],13:[function(require,module,exports){
"use strict";

/**
  ### DSL for input parameters

  There is a small DSL to help with `forall`. For example the two definitions below are equivalent:
  ```js
  var bool_fn_applied_thrice = jsc.forall("bool -> bool", "bool", check);
  var bool_fn_applied_thrice = jsc.forall(jsc.fn(jsc.bool()), jsc.bool(), check);
  ```

  The DSL is based on a subset of language recognized by [typify-parser](https://github.com/phadej/typify-parser):
  - *identifiers* are fetched from the predefined environment.
  - *applications* are applied as one could expect: `"array bool"` is evaluated to `jsc.array(jsc.bool)`.
  - *functions* are supported: `"bool -> bool"` is evaluated to `jsc.fn(jsc.bool())`.
  - *square brackets* are treated as a shorthand for the array type: `"[nat]"` is evaluated to `jsc.array(jsc.nat)`.
*/

var arbitrary = require("./arbitrary.js");
var fn = require("./fn.js");
var typifyParser = require("typify-parser");

// Forward declarations
var compileType;
var compileTypeArray;

function compileIdent(env, type) {
  var g = env[type.value];
  if (!g) {
    throw new Error("Unknown generator: " + type.value);
  }
  return g;
}

function compileApplication(env, type) {
  var callee = compileType(env, type.callee);
  var args = compileTypeArray(env, type.args);

  return callee.apply(undefined, args);
}

function compileFunction(env, type) {
  // we don't care about argument type
  var result = compileType(env, type.result);
  return fn.fn(result);
}

function compileBrackets(env, type) {
  var arg = compileType(env, type.arg);
  return arbitrary.array(arg);
}

function compileDisjunction(env, type) {
  var args = compileTypeArray(env, type.args);
  return arbitrary.oneof(args);
}

function compileRecord(env, type) {
  // TODO: use mapValues
  var spec = {};
  Object.keys(type.fields).forEach(function (key) {
    spec[key] = compileType(env, type.fields[key]);
  });
  return arbitrary.record(spec);
}

compileType = function compileType(env, type) {
  switch (type.type) {
    case "ident": return compileIdent(env, type);
    case "application": return compileApplication(env, type);
    case "function": return compileFunction(env, type);
    case "brackets": return compileBrackets(env, type);
    case "disjunction": return compileDisjunction(env, type);
    case "record": return compileRecord(env, type);
    case "number": return type.value;
    default: throw new Error("Unsupported typify ast type: " + type.type);
  }
};

compileTypeArray = function compileTypeArray(env, types) {
  return types.map(function (type) {
    return compileType(env, type);
  });
};

function parseTypify(env, str) {
  var type = typifyParser(str);
  return compileType(env, type);
}

module.exports = {
  parseTypify: parseTypify,
};

},{"./arbitrary.js":1,"./fn.js":4,"typify-parser":20}],14:[function(require,module,exports){
"use strict";

var isArray = Array.isArray;
function isObject(o) {
  /* eslint-disable no-new-object */
  return new Object(o) === o;
  /* eslint-enable no-new-object */
}

/**
  ### Utility functions

  Utility functions are exposed (and documented) only to make contributions to jsverify easy.
  The changes here don't follow semver, i.e. ther might backward-incompatible changes even in patch releases.

  Use [underscore.js](http://underscorejs.org/), [lodash](https://lodash.com/), [ramda](http://ramda.github.io/ramdocs/docs/), [lazy.js](http://danieltao.com/lazy.js/) or some other utility belt.
*/

/**
  - `utils.isEqual(x: json, y: json): bool`

      Equality test for `json` objects.
*/
function isEqual(a, b) {
  var i;

  if (a === b) {
    return true;
  } else if (isArray(a) && isArray(b) && a.length === b.length) {
    for (i = 0; i < a.length; i++) {
      if (!isEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  } else if (isObject(a) && isObject(b) && !isArray(a) && !isArray(b)) {
    var akeys = Object.keys(a);
    var bkeys = Object.keys(b);
    if (!isEqual(akeys, bkeys)) {
      return false;
    }

    for (i = 0; i < akeys.length; i++) {
      if (!isEqual(a[akeys[i]], b[akeys[i]])) {
        return false;
      }
    }
    return true;
  }

  return false;
}

function pluck(arr, key) {
  return arr.map(function (e) {
    return e[key];
  });
}

/**
  - `utils.force(x: a | () -> a) : a`

      Evaluate `x` as nullary function, if it is one.
*/
function force(arb) {
  return (typeof arb === "function") ? arb() : arb;
}

/**
  - `utils.merge(x: obj, y: obj): obj`

    Merge two objects, a bit like `_.extend({}, x, y)`
*/
function merge(x, y) {
  var res = {};
  Object.keys(x).forEach(function (k) {
    res[k] = x[k];
  });
  Object.keys(y).forEach(function (k) {
    res[k] = y[k];
  });
  return res;
}

function div2(x) {
  return Math.floor(x / 2);
}

module.exports = {
  isArray: isArray,
  isObject: isObject,
  isEqual: isEqual,
  pluck: pluck,
  force: force,
  merge: merge,
  div2: div2,
};

},{}],15:[function(require,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = require('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && (isNaN(value) || !isFinite(value))) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":18}],16:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],17:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],18:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

},{"./support/isBuffer":17,"inherits":16}],19:[function(require,module,exports){
"use strict";

// Based on RC4 algorithm, as described in
// http://en.wikipedia.org/wiki/RC4

function createRC4(N) {
  function identityPermutation() {
    var s = new Array(N);
    for (var i = 0; i < N; i++) {
      s[i] = i;
    }
    return s;
  }

  // :: string | array integer -> array integer
  function seed(key) {
    if (key === undefined) {
      key = new Array(N);
      for (var k = 0; k < N; k++) {
        key[k] = Math.floor(Math.random() * N);
      }
    } else if (typeof key === "string") {
      // to string
      key = "" + key;
      key = key.split("").map(function (c) { return c.charCodeAt(0) % N; });
    } else if (Array.isArray(key)) {
      if (!key.every(function (v) {
        return typeof v === "number" && v === (v | 0);
      })) {
        throw new TypeError("invalid seed key specified: not array of integers");
      }
    } else {
      throw new TypeError("invalid seed key specified");
    }

    var keylen = key.length;

    // resed state
    var s = identityPermutation();

    var j = 0;
    for (var i = 0; i < N; i++) {
      j = (j + s[i] + key[i % keylen]) % N;
      var tmp = s[i];
      s[i] = s[j];
      s[j] = tmp;
    }

    return s;
  }

  function RC4(key) {
    this.s = seed(key);
    this.i = 0;
    this.j = 0;
  }

  RC4.prototype.randomNative = function () {
    this.i = (this.i + 1) % N;
    this.j = (this.j + this.s[this.i]) % N;

    var tmp = this.s[this.i];
    this.s[this.i] = this.s[this.j];
    this.s[this.j] = tmp;

    var k = this.s[(this.s[this.i] + this.s[this.j]) % N];

    return k;
  };

  RC4.prototype.randomUInt32 = function () {
    var a = this.randomByte();
    var b = this.randomByte();
    var c = this.randomByte();
    var d = this.randomByte();

    return ((a * 256 + b) * 256 + c) * 256 + d;
  };

  RC4.prototype.randomFloat = function () {
    return this.randomUInt32() / 0x100000000;
  };

  RC4.prototype.random = function() {
    var a, b;
    if (arguments.length === 1) {
      a = 0;
      b = arguments[0];
    } else if (arguments.length === 2) {
      a = arguments[0];
      b = arguments[1];
    } else {
      throw new TypeError("random takes one or two integer arguments");
    }

    if (a !== (a | 0) || b !== (b | 0)) {
      throw new TypeError("random takes one or two integer arguments");
    }

    return a + this.randomUInt32() % (b - a + 1);
  };

  RC4.prototype.currentState = function () {
    return {
      i: this.i,
      j: this.j,
      s: this.s.slice(), // copy
    };
  };

  RC4.prototype.setState = function(state) {
    var s = state.s;
    var i = state.i;
    var j = state.j;

    if (!(i === (i | 0) && 0 <= i && i < N)) {
      throw new Error("state.i should be integer [0, " + (N-1) + "]");
    }

    if (!(j === (j | 0) && 0 <= j && j < N)) {
      throw new Error("state.j should be integer [0, " + (N-1) + "]");
    }

    // check length
    if (!Array.isArray(s) || s.length !== N) {
      throw new Error("state should be array of length " + N);
    }

    // check that all params are there
    for (var k = 0; k < N; k++) {
      if (s.indexOf(k) === -1) {
        throw new Error("state should be permutation of 0.." + (N-1) + ": " + k + " is missing");
      }
    }

    this.i = i;
    this.j = j;
    this.s = s.slice(); // assign copy
  };

  return RC4;
}

var RC4 = createRC4(256);
RC4.prototype.randomByte = RC4.prototype.randomNative;

var RC4small = createRC4(16);
RC4small.prototype.randomByte = function () {
  var a = this.randomNative();
  var b = this.randomNative();

  return a * 16 + b;
};

var ordA = "a".charCodeAt(0);
var ord0 = "0".charCodeAt(0);

function toHex(n) {
  return n < 10 ? String.fromCharCode(ord0 + n) : String.fromCharCode(ordA + n - 10);
}

function fromHex(c) {
  return parseInt(c, 16);
}

RC4small.prototype.currentStateString = function () {
  var state = this.currentState();

  var i = toHex(state.i);
  var j = toHex(state.j);

  var res =  i + j + state.s.map(toHex).join("");
  return res;
};

RC4small.prototype.setStateString = function (stateString) {
  if (!stateString.match(/^[0-9a-f]{18}$/)) {
    throw new TypeError("RC4small stateString should be 18 hex character string");
  }

  var i = fromHex(stateString[0]);
  var j = fromHex(stateString[1]);
  var s = stateString.split("").slice(2).map(fromHex);

  this.setState({
    i: i,
    j: j,
    s: s,
  });
};

RC4.RC4small = RC4small;

module.exports = RC4;

},{}],20:[function(require,module,exports){
/**
  # typify type parser

  > Type signature parser for typify

  [![Build Status](https://secure.travis-ci.org/phadej/typify-parser.svg?branch=master)](http://travis-ci.org/phadej/typify-parser)
  [![NPM version](https://badge.fury.io/js/typify-parser.svg)](http://badge.fury.io/js/typify-parser)
  [![Dependency Status](https://david-dm.org/phadej/typify-parser.svg)](https://david-dm.org/phadej/typify-parser)
  [![devDependency Status](https://david-dm.org/phadej/typify-parser/dev-status.svg)](https://david-dm.org/phadej/typify-parser#info=devDependencies)
  [![Code Climate](https://img.shields.io/codeclimate/github/phadej/typify-parser.svg)](https://codeclimate.com/github/phadej/typify-parser)

  Turns `(foo, bar 42) -> quux` into
  ```js
  {
    "type": "function",
    "arg": {
      "type": "product",
      "args": [
        {
          "type": "ident",
          "value": "foo"
        },
        {
          "type": "application",
          "callee": {
            "type": "ident",
            "value": "bar"
          },
          "args": [
            {
              "type": "number",
              "value": 42
            }
          ]
        }
      ]
    },
    "result": {
      "type": "ident",
      "value": "quux"
    }
  }
  ```
*/
"use strict";

function unescapeString(str) {
  return str.replace(/\\(?:'|"|\\|n|x[0-9a-fA-F]{2})/g, function (match) {
    switch (match[1]) {
      case "'": return "'";
      case "\"": return "\"";
      case "\\": return "\\";
      case "n": return "\n";
      case "x": return String.fromCharCode(parseInt(match.substr(2), 16));
    }
  });
}

function lex(input) {
  // Unicode
  // top: 22a4
  // bottom: 22a5
  // and: 2227
  // or: 2228
  // times: \u00d7
  // to: 2192
  // ellipsis: 2026
  // blackboard 1: d835 dfd9
  var m = input.match(/^([ \t\r\n]+|[\u22a4\u22a5\u2227\u2228\u00d7\u2192\u2026]|\ud835\udfd9|_\|_|\*|\(\)|"(?:[^"\\]|\\[\\'"n]|\\x[0-9a-fA-F]{2})*"|'(?:[^'\\]|\\[\\'"n]|\\x[0-9a-fA-F]{2})*'|[0-9a-zA-Z_\$@]+|,|->|:|;|&|\||\.\.\.|\(|\)|\[|\]|\{|\}|\?)*$/);
  if (m === null) {
    throw new SyntaxError("Cannot lex type signature");
  }
  m = input.match(/([ \t\r\n]+|[\u22a4\u22a5\u2227\u2228\u00d7\u2192\u2026]|\ud835\udfd9|_\|_|\*|\(\)|"(?:[^"\\]|\\[\\'"n]|\\x[0-9a-fA-F]{2})*"|'(?:[^'\\]|\\[\\'"n]|\\x[0-9a-fA-F]{2})*'|[0-9a-zA-Z_\$@]+|,|->|:|;|&|\||\.\.\.|\(|\)|\[|\]|\{|\}|\?)/g);

  return m
  .map(function (token) {
    switch (token) {
      case "_|_": return { type: "false" };
      case "\u22a5": return { type: "false" };
      case "*": return { type: "true" };
      case "\u22a4": return { type: "true" };
      case "()": return { type: "unit" };
      case "\ud835\udfd9": return { type: "unit" };
      case "true": return { type: "bool", value: true };
      case "false": return { type: "bool", value: false };
      case "&": return { type: "&" };
      case "\u2227": return { type: "&" };
      case "|": return { type: "|" };
      case "\u2228": return { type: "|" };
      case ",": return { type: "," };
      case "\u00d7": return { type: "," };
      case ";": return { type: ";" };
      case ":": return { type: ":" };
      case "(": return { type: "(" };
      case ")": return { type: ")" };
      case "[": return { type: "[" };
      case "]": return { type: "]" };
      case "{": return { type: "{" };
      case "}": return { type: "}" };
      case "?": return { type: "?" };
      case "->": return { type: "->" };
      case "\u2192": return { type: "->" };
      case "...": return { type: "..." };
      case "\u2026": return { type: "..." };
    }

    // Whitespace
    if (token.match(/^[ \r\r\n]+$/)) {
      return null;
    }

    if (token.match(/^[0-9]+/)) {
      return { type: "number", value: parseInt(token, 10) };
    }

    if (token[0] === "'" || token[0] === "\"") {
      token = token.slice(1, -1);
      return { type: "string", value: unescapeString(token) };
    }

    return { type: "ident", value: token };
  })
  .filter(function (token) {
    return token !== null;
  });
}

function makePunctParser(type) {
  return function (state) {
    if (state.pos >= state.len) {
      throw new SyntaxError("Expecting identifier, end-of-input found");
    }

    var token = state.tokens[state.pos];
    if (token.type !== type) {
      throw new SyntaxError("Expecting '" + type + "', found: " + token.type);
    }
    state.pos += 1;

    return type;
  };
}

var colonParser = makePunctParser(":");
var openCurlyParser = makePunctParser("{");
var closeCurlyParser = makePunctParser("}");
var semicolonParser = makePunctParser(";");
var openParenParser = makePunctParser("(");
var closeParenParser = makePunctParser(")");
var openBracketParser = makePunctParser("[");
var closeBracketParser = makePunctParser("]");

function nameParser(state) {
  if (state.pos >= state.len) {
    throw new SyntaxError("Expecting identifier, end-of-input found");
  }

  var token = state.tokens[state.pos];
  if (token.type !== "ident") {
    throw new SyntaxError("Expecting 'ident', found: " + token.type);
  }
  state.pos += 1;

  return token.value;
}

function recordParser(state) {
  openCurlyParser(state);

  var token = state.tokens[state.pos];
  if (token && token.type === "}") {
    closeCurlyParser(state);
    return { type: "record", fields: {} };
  }

  var fields = {};

  while (true) {
    // read
    var name = nameParser(state);
    colonParser(state);
    var value = typeParser(state);

    // assign to fields
    fields[name] = value;

    // ending token
    token = state.tokens[state.pos];

    // break if }
    if (token && token.type === "}") {
      closeCurlyParser(state);
      break;
    } else if (token && token.type === ";") {
      semicolonParser(state);
    } else {
      throw new SyntaxError("Expecting '}' or ';', found: " + token.type);
    }
  }

  return { type: "record", fields: fields };
}

function postfix(parser, postfixToken, constructor) {
  return function (state) {
    var arg = parser(state);

    var token = state.tokens[state.pos];
    if (token && token.type === postfixToken) {
      state.pos += 1;
      return {
        type: constructor,
        arg: arg,
      };
    } else {
      return arg;
    }
  };
}

var optionalParser = postfix(terminalParser, "?", "optional");

function applicationParser(state) {
  var rator = optionalParser(state);
  var rands = [];

  while (true) {
    var pos = state.pos;
    // XXX: we shouldn't use exceptions for this
    try {
      var arg = optionalParser(state);
      rands.push(arg);
    } catch (err) {
      state.pos = pos;
      break;
    }
  }

  if (rands.length === 0) {
    return rator;
  } else {
    return {
      type: "application",
      callee: rator,
      args: rands,
    };
  }
}

function separatedBy(parser, separator, constructor) {
  return function (state) {
    var list = [parser(state)];
    while (true) {
      // separator
      var token = state.tokens[state.pos];
      if (token && token.type === separator) {
        state.pos += 1;
      } else {
        break;
      }

      // right argument
      list.push(parser(state));
    }

    if (list.length === 1) {
      return list[0];
    } else {
      return {
        type: constructor,
        args: list,
      };
    }
  };
}

var conjunctionParser = separatedBy(applicationParser, "&", "conjunction");
var disjunctionParser = separatedBy(conjunctionParser, "|", "disjunction");

// TODO: combine with optional
var variadicParser = postfix(disjunctionParser, "...", "variadic");

function namedParser(state) {
  var token1 = state.tokens[state.pos];
  var token2 = state.tokens[state.pos + 1];
  if (token1 && token2 && token1.type === "ident" && token2.type === ":") {
    state.pos += 2;
    var arg = namedParser(state);
    return {
      type: "named",
      name: token1.value,
      arg: arg,
    };
  } else {
    return variadicParser(state);
  }
}

var productParser = separatedBy(namedParser, ",", "product");

function functionParser(state) {
  var v = productParser(state);

  var token = state.tokens[state.pos];
  if (token && token.type === "->") {
    state.pos += 1;
    var result = functionParser(state);
    return {
      type: "function",
      arg: v,
      result: result,
    };
  } else {
    return v;
  }
}

function typeParser(state) {
  return functionParser(state);
}

function parenthesesParser(state) {
  openParenParser(state);
  var type = typeParser(state);
  closeParenParser(state);
  return type;
}

function bracketParser(state) {
  openBracketParser(state);
  var type = typeParser(state);
  closeBracketParser(state);
  return {
    type: "brackets",
    arg: type,
  };
}

function terminalParser(state) {
  if (state.pos >= state.len) {
    throw new SyntaxError("Expecting terminal, end-of-input found");
  }

  var token = state.tokens[state.pos];
  switch (token.type) {
    case "false":
    case "true":
    case "unit":
    case "string":
    case "number":
    case "bool":
    case "ident":
      state.pos += 1;
      return token;
    case "{":
      return recordParser(state);
    case "(":
      return parenthesesParser(state);
    case "[":
      return bracketParser(state);
    default:
      throw new SyntaxError("Expecting terminal, " + token.type + " found");
  }
}

function parse(input) {
  // console.log(input);
  var tokens = lex(input);
  // console.log(tokens);
  var state = {
    pos: 0,
    len: tokens.length,
    tokens: tokens,
  };

  var res = typeParser(state);
  // console.log(state);
  if (state.pos !== state.len) {
    throw new SyntaxError("expecting end-of-input, " + tokens[state.pos].type + " found");
  }
  return res;
}

module.exports = parse;

},{}]},{},[7])(7)
});