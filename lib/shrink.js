/* @flow weak */
"use strict";

var assert = require("assert");
var either = require("./either.js");
var utils = require("./utils.js");

/**
  ### Shrink functions

  A shrink function, `shrink a`, is a function `a -> [a]`, returning an array of *smaller* values.

  Shrink combinators are auto-curried:

  ```js
  var xs = shrink.array(shrink.nat, [1]); // ≡
  var ys = shrink.array(shrink.nat)([1]);
  ```
*/

// Blessing: i.e adding prototype
/* eslint-disable no-use-before-define */
function shrinkProtoIsoMap(f, g) {
  /* jshint validthis:true */
  var shrink = this;
  return shrinkBless(function (value) {
    return shrink(g(value)).map(f);
  });
}
/* eslint-enable no-use-before-define */

/**
  - `shrink.bless(f: a -> [a]): shrink a`

      Bless function with `.isomap` property.

  - `.isomap(f: a -> b, g: b -> a): shrink b`

      Transform `shrink a` into `shrink b`. For example:

      ```js
      positiveIntegersShrink = nat.shrink.isomap(
        function (x) { return x + 1; },
        function (x) { return x - 1; });
      ```
*/
function shrinkBless(shrink) {
  shrink.isomap = shrinkProtoIsoMap;
  return shrink;
}

/**
  - `shrink.noop: shrink a`
*/
var shrinkNoop = shrinkBless(function shrinkNoop() {
  return [];
});

/**
  - `shrink.pair(shrA: shrink a, shrB: shrink b): shrink (a, b)`
*/
function shrinkPair(shrinkA, shrinkB) {
  var result = shrinkBless(function (pair) {
    assert(pair.length === 2, "shrinkPair: pair should be an Array of length 2");

    var a = pair[0];
    var b = pair[1];

    var shrinkedA = shrinkA(a);
    var shrinkedB = shrinkB(b);

    var pairA = shrinkedA.map(function (ap) {
      return [ap, b];
    });

    var pairB = shrinkedB.map(function (bp) {
      return [a, bp];
    });

    return pairA.concat(pairB);
  });

  return utils.curried3(result, arguments);
}

/**
  - `shrink.either(shrA: shrink a, shrB: shrink b): shrink (either a b)`
*/
function shrinkEither(shrinkA, shrinkB) {
  function shrinkLeft(value) {
    return shrinkA(value).map(either.left);
  }

  function shrinkRight(value) {
    return shrinkB(value).map(either.right);
  }

  var result = shrinkBless(function (e) {
    return e.either(shrinkLeft, shrinkRight);
  });

  return utils.curried3(result, arguments);
}

// a → Vec a 1
function toSingleton(x) {
  return [x];
}

// Vec a 1 → a
function fromSingleton(a) {
  return a[0];
}

// a × HList b → HList (a ∷ b)
function toHList(p) {
  return [p[0]].concat(p[1]);
}

// HList (a ∷ b) → a × HList b
function fromHList(h) {
  return [h[0], h.slice(1)];
}

function shrinkTupleImpl(shrinks, n) {
  if (n + 1 === shrinks.length) {
    return shrinks[n].isomap(toSingleton, fromSingleton);
  } else {
    var shrinkA = shrinks[0];
    var shrinkB = shrinkTupleImpl(shrinks, n + 1);
    return shrinkPair(shrinkA, shrinkB).isomap(toHList, fromHList);
  }
}

/**
  - `shrink.tuple(shrs: (shrink a, shrink b...)): shrink (a, b...)`
*/
function shrinkTuple(shrinks) {
  assert(shrinks.length > 0, "shrinkTuple needs > 0 values");
  var result = shrinkTupleImpl(shrinks, 0);
  return utils.curried2(result, arguments);
}

function shrinkArrayWithMinimumSize(size) {
  function shrinkArrayImpl(shrink) {
    var result = shrinkBless(function (arr) {
      if (arr.length <= size) {
        return [];
      } else {
        var x = arr[0];
        var xs = arr.slice(1);

        return [xs].concat(
          shrink(x).map(function (xp) { return [xp].concat(xs); }),
          shrinkArrayImpl(shrink, xs).map(function (xsp) { return [x].concat(xsp); })
        );
      }
    });

    return utils.curried2(result, arguments);
  }

  return shrinkArrayImpl;
}

/**
  - `shrink.array(shr: shrink a): shrink (array a)`
*/
var shrinkArray = shrinkArrayWithMinimumSize(0);

/**
  - `shrink.nearray(shr: shrink a): shrink (nearray a)`
*/
var shrinkNEArray = shrinkArrayWithMinimumSize(1);

/**
  - `shrink.record(shrs: { key: shrink a... }): shrink { key: a... }`
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

  return utils.curried2(result, arguments);
}

module.exports = {
  noop: shrinkNoop,
  pair: shrinkPair,
  either: shrinkEither,
  tuple: shrinkTuple,
  array: shrinkArray,
  nearray: shrinkNEArray,
  record: shrinkRecord,
  bless: shrinkBless,
};
