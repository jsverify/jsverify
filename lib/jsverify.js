/**
  # JSVerify

  > Property based checking.

  [![Build Status](https://secure.travis-ci.org/phadej/jsverify.png?branch=master)](http://travis-ci.org/phadej/jsverify)
  [![NPM version](https://badge.fury.io/js/jsverify.png)](http://badge.fury.io/js/jsverify)
  [![Dependency Status](https://gemnasium.com/phadej/jsverify.png)](https://gemnasium.com/phadej/jsverify)
  [![Code Climate](https://codeclimate.com/github/phadej/jsverify.png)](https://codeclimate.com/github/phadej/jsverify)

  ## Getting Started

  Install the module with: `npm install jsverify`

  ## Synopsis

  ```js
  var jsc = require("jsverify");

  // forall (f : bool -> bool) (b : bool), f (f (f b)) = f(b).
  var bool_fn_applied_thrice =
    jsc.forall(jsc.fun(jsc.bool()), jsc.bool(), function (f, b) {
      return f(f(f(b))) === f(b);
    });

  jsc.assert(bool_fn_applied_thrice);
  // OK, passed 100 tests
  ```
*/
/* jshint node:true */
  "use strict";

/**
  ## Documentation

  ### Use with [jasmine](http://pivotal.github.io/jasmine/) 1.3.x

  Check [jasmineHelpers.js](speclib/jasmineHelpers.js) file.

  ## API

  > _Testing shows the presence, not the absence of bugs._
  >
  > Edsger W. Dijkstra

  To show that propositions hold, we need to construct proofs.
  There are two extremes: proof by example (unit tests) and formal (machine-checked) proof.
  Property-based testing is something in between.
  We formulate propositions, invariants or other properties we believe to hold, but
  only test it to hold for numerous (random generated) values.

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

/**
  ### jsc._ - miscellaneous utilities
*/

/**
  #### assert (exp : bool) (message : string) : void

  Throw an error with `message` if `exp` is falsy.
  Resembles [node.js assert](http://nodejs.org/api/assert.html).
*/
var assert = require("assert");
var shrink = require("./shrink.js");
var random = require("./random.js");
var arbitrary = require("./arbitrary.js");
var primitive = require("./primitive.js");

var isArray = Array.isArray;
function isObject(o) {
  return new Object(o) === o;
}

/**
  #### isEqual (a b : value) : bool

  Equality test for `value` objects. See `value` generator.
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
  #### FMap (eq : a -> a -> bool) : FMap a

  Finite map, with any object a key.

  Short summary of member functions:

  - FMap.insert (key : a) (value : any) : void
  - FMap.get (key : a) : any
  - FMap.contains (key : a) : obool
*/
function FMap(eq) {
  this.eq = eq || isEqual;
  this.data = [];
}

FMap.prototype.contains = function FMap_contains(key) {
  for (var i = 0; i < this.data.length; i++) {
    if (this.eq(this.data[i][0], key)) {
      return true;
    }
  }

  return false;
};

FMap.prototype.insert = function FMap_insert(key, value) {
  for (var i = 0; i < this.data.length; i++) {
    if (this.eq(this.data[i][0], key)) {
      this.data[i] = [key, value];
      return;
    }
  }

  this.data.push([key, value]);
};

FMap.prototype.get = function FMap_get(key) {
  for (var i = 0; i < this.data.length; i++) {
    if (this.eq(this.data[i][0], key)) {
      return this.data[i][1];
    }
  }
};

function showWith(gen, obj) {
  if (gen && typeof gen.show === "function") {
    return gen.show(obj);
  } else {
    return "" + obj;
  }
}

function showManyWith(gens, objs) {
  var strs = [];
  for (var i = 0; i < gens.length; i++) {
    strs.push(showWith(gens[i], objs[i]));
  }
  return strs.join("; ");
}

/**
  #### isPromise p : bool

  Optimistic duck-type check for promises.
  Returns `true` if p is an object with `.then` function property.
*/
function isPromise(p) {
  return new Object(p) === p && typeof p.then === "function";
}

/**
  #### withPromise (Functor f) (p : f a) (f : a -> b) : f b

  This is functor map, `fmap`, with arguments flipped.
  Essentially `f(p)`. If `p` is promise, returns new promise.
  Using `withPromise` makes code look very much [CPS-style](http://en.wikipedia.org/wiki/Continuation-passing_style).
*/
function withPromise(p, f) {
  if (isPromise(p)) {
    return p.then(f);
  } else {
    return f(p);
  }
}

function applyPromise(f, xs, h) {
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
      function (e) { return h(false, exc); }
    );
  } else {
    return h(r, exc);
  }
}

/// include ./random.js

/**
  ### Properties
*/

function shrinkResult(gens, x, test, size, shrinks, exc, transform) {
  var shrinked = shrink.tuple(pluck(gens, "shrink"), x);
  var shrinkP = shrinked.reduce(function (res, y) {
    return withPromise(res, function (res) {
      if (res !== true) {
        return res;
      }

      return test(size, y, shrinks + 1);
    });
  }, true);

  return withPromise(shrinkP, function (shrinkP) {
    if (shrinkP === true) {
      var res = {
        counterexample: x,
        counterexamplestr: showManyWith(gens, x),
        shrinks: shrinks,
        exc: exc,
      };
      return transform ? transform(res) : res;
    } else {
      return shrinkP;
    }
  });
}

/**
  #### forall (gens : generator a ...) (prop : a -> property_rec) : property

  Property constructor
*/
function forall() {
  var gens = Array.prototype.slice.call(arguments, 0, -1);
  var property = arguments[arguments.length - 1];

  assert(typeof property === "function", "property should be a function");

  function test(size, x, shrinks) {
    assert(x !== undefined, "generator result should be always not undefined -- temporary self check");
    shrinks = shrinks || 0;

    return applyPromise(property, x, function(r, exc) {
      if (r === true) { return true; }
      if (typeof r === "function") {
        var r_rec = r(size);

        return withPromise(r_rec, function (r_rec) {
          if (r_rec === true) {
            return true;
          } else {
            return shrinkResult(gens, x, test, size, shrinks, exc, function (r) {
              return {
                counterexample: r.counterexample.concat(r_rec.counterexample),
                counterexamplestr: r.counterexamplestr ,//+ "; " + r_rec.counterexamplestr,
                shrinks: r.shrinks,
                exc: r.exc || r_rec.exc,
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

function formatFailedCase(r) {
  return "Failed after " + r.tests + " tests and " + r.shrinks + " shrinks. Counterexample: " + r.counterexamplestr;
}

/**
  #### check (prop : property) (opts : checkoptions) : promise result + result

  Run random checks for given `prop`. If `prop` is promise based, result is also wrapped in promise.

  Options:
  - `opts.tests` - test count to run, default 100
  - `opts.size`  - maximum size of generated values, default 5
  - `opts.quiet` - do not `console.log`
*/
function check(property, opts) {
  opts = opts || {};
  opts.size = opts.size || 5;
  opts.tests = opts.tests || 100;
  opts.quiet = opts.quiet || false;

  assert(typeof property === "function", "property should be a function");

  function loop(i) {
    if (i > opts.tests) {
      return true;
    }

    var size = i % (opts.size + 1);

    var r = property(size);
    return withPromise(r, function (r) {
      if (r === true) {
        return loop(i + 1);
      } else {
        r.tests = i;
        /* global console */
        if (!opts.quiet) {
          console.error(formatFailedCase(r), r.counterexample);
        }
        return r;
      }
    });
  }

  return withPromise(loop(1), function (r) {
    if (r === true) {
      if (!opts.quiet) { console.info("OK, passed " + opts.tests + " tests"); }
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

  return withPromise(check(property, opts), function (r) {
    if (r !== true) {
      throw new Error(formatFailedCase(r));
    }
  });
}

/**
  ### Primitive generators
*/

/// include primitive.js

/**
  #### array (gen : generator a) : generator (array a)
*/

function showArray(generator, arr) {
  return "[" + arr.map(showWith.bind(null, generator)).join(", ") + "]";
}

function array(generator) {
  generator = generator || primitive.value();

  return {
    arbitrary: function (size) {
      return arbitrary.array(generator.arbitrary, size);
    },

    shrink: shrink.array.bind(null, generator.shrink),

    show: showArray.bind(null, generator),
  };
}


function nonshrinkarray(generator) {
  generator = generator || primitive.value();

  return {
    arbitrary: function (size) {
      return arbitrary.array(generator.arbitrary, size);
    },

    shrink: shrink.noop,
    show: showArray.bind(null, generator),
  };
}

/**
  #### fun (gen : generator a) : generator (b -> a)

  Unary functions.
*/
function fun(gen) {
  gen = gen || primitive.value();

  return {
    arbitrary: function (size) {
      var m = new FMap();

      return function (arg) {
        if (!m.contains(arg)) {
          var value = gen.arbitrary(size);
          m.insert(arg, value);
        }

        return m.get(arg);
      };
    },

    shrink: shrink.noop,
  };
}

/**
  ### Generator combinators
*/

/**
  #### pair (a : generator A) (b : generator B) : generator (A * B)

  If not specified `a` and `b` are equal to `value()`.
*/
function pair(a, b) {
  a = a || primitive.value();
  b = b || primitive.value();

  return {
    arbitrary: function (size) {
      return [a.arbitrary(size), b.arbitrary(size)];
    },

    shrink: function (p) {
      return shrink.tuple([a.shrink, b.shrink], p);
    },
  };
}

/**
  #### suchthat (gen : generator a) (p : a -> bool) : generator {a | p a == true}

  Generator of values that satisfy `p` predicate. It's adviced that `p`'s accept rate is high.
*/
function suchthat(generator, predicate) {
  return {
    arbitrary: function (size) {
      for (var i = 0; ; i++) {
        // if 5 tries failed, increase size
        if (i > 5) {
          i = 0;
          size += 1;
        }

        var x = generator.arbitrary(size);
        if (predicate(x)) {
          return x;
        }
      }
    },

    shrink: function (x) {
      return generator.shrink(x).filter(predicate);
    },
  };
}

// Export
var jsc = {
  forall: forall,
  check: check,
  assert: checkThrow,

  // generators
  nat: primitive.nat,
  integer: primitive.integer,
  number : primitive.number,
  bool: primitive.bool,
  string: primitive.string,
  value: primitive.value,
  oneof: primitive.oneof,
  pair: pair,
  array: array,
  nonshrinkarray: nonshrinkarray,
  fun: fun,
  suchthat: suchthat,

  // internal utility lib
  _: {
    assert: assert,
    isEqual: isEqual,
    FMap: FMap,
    isPromise: isPromise,
    withPromise: withPromise,
    getRandomInt: random,
    getRandomArbitrary: random,
  },
};

module.exports = jsc;

/// plain ../CONTRIBUTING.md
/// plain ../CHANGELOG.md
/// plain ../related-work.md
/// plain ../LICENSE
