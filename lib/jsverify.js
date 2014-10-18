/**
  # JSVerify

  > Property based checking.

  [![Build Status](https://secure.travis-ci.org/phadej/jsverify.svg?branch=master)](http://travis-ci.org/phadej/jsverify)
  [![NPM version](https://badge.fury.io/js/jsverify.svg)](http://badge.fury.io/js/jsverify)
  [![Dependency Status](https://david-dm.org/phadej/jsverify.svg)](https://david-dm.org/phadej/jsverify)
  [![devDependency Status](https://david-dm.org/phadej/jsverify/dev-status.svg)](https://david-dm.org/phadej/jsverify#info=devDependencies)
  [![Code Climate](https://img.shields.io/codeclimate/github/phadej/jsverify.svg)](https://codeclimate.com/github/phadej/jsverify)

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

  Some type definitions to keep developers sane:

  - Functor f => property (size : nat) : f result
  - result := true | { counterexample: any }
  - Functor f => property_rec := f (result | property)
  - generator a := { arbitrary : a, shrink : a -> [a] }
*/

var assert = require("assert");

var combinator = require("./combinator.js");
var composite = require("./composite.js");
var environment = require("./environment.js");
var FMap = require("./finitemap.js");
var fn = require("./fn.js");
var functor = require("./functor.js");
var generator = require("./generator.js");
var primitive = require("./primitive.js");
var random = require("./random.js");
var show = require("./show.js");
var shrink = require("./shrink.js");
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

/**
  #### forall (gens : generator a ...) (prop : a -> property_rec) : property

  Property constructor
*/
function forall() {
  var args = Array.prototype.slice.call(arguments);
  var gens = args.slice(0, -1);
  var property = args[args.length - 1];

  // Map typify-dsl to hard generators
  gens = gens.map(function (g) {
    g = typeof g === "string" ? typify.parseTypify(environment, g) : g;
    return generator.force(g);
  });

  assert(typeof property === "function", "property should be a function");

  function test(size, x, shrinks) {
    assert(x !== undefined, "generator result should be always not undefined -- temporary self check");
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
    var x = gens.map(function (gen) { return gen.arbitrary(size); });
    var r =  test(size, x);
    return r;
  };
}

function formatFailedCase(r, state) {
  var msg =  "Failed after " + r.tests + " tests and " + r.shrinks + " shrinks. ";
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
  #### check (prop : property) (opts : checkoptions) : promise result + result

  Run random checks for given `prop`. If `prop` is promise based, result is also wrapped in promise.

  Options:
  - `opts.tests` - test count to run, default 100
  - `opts.size`  - maximum size of generated values, default 5
  - `opts.quiet` - do not `console.log`
  - `opts.rngState` - state string for the rng
*/
function check(property, opts) {
  opts = opts || {};
  opts.size = opts.size || 10;
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
  #### assert (prop : property) (opts : checkoptions) : void

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

/// include ./typify.js
/// include ./primitive.js
/// include ./composite.js
/// include ./fn.js
/// include ./combinator.js

/**
  ### jsc._ - miscellaneous utilities

  #### assert (exp : bool) (message : string) : void

  Throw an error with `message` if `exp` is falsy.
  Resembles [node.js assert](http://nodejs.org/api/assert.html).
*/
/// include ./utils.js
/// include ./random.js
/// include ./finitemap.js

// Export
var jsc = {
  forall: forall,
  check: check,
  assert: checkThrow,

  // generators
  pair: composite.pair,
  array: composite.array,
  map: composite.map,
  record: composite.record,
  fn: fn.fn,
  fun: fn.fn,
  suchthat: combinator.suchthat,
  nonshrink: combinator.nonshrink,

  // internal utility lib
  _: {
    assert: assert,
    isEqual: utils.isEqual,
    random: random,
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
