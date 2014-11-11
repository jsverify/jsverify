"use strict";

var isArray = Array.isArray;
function isObject(o) {
  /* eslint-disable no-new-object */
  return new Object(o) === o;
  /* eslint-enable no-new-object */
}

/**
  ### Utility functions
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

/**
  - `utils.not(x -> y): x -> y`

      An inverted version of the given function. For example,
      `utils.not(empty)` will return a function that returns `true`
      when soemthing is _not_ empty.
*/
function not(x) {
  return function () {
    if (typeof x !== "function") {
      throw new Error("Arguments to `not` must be a function.");
    } else {
      return !x.apply(undefined, arguments);
    }
  };
}

function checkIsArrayWithAtLeastTwoElems(a) {
  if (!Array.isArray(a)) {
    throw new Error("argument must be an array.");
  } else if (a.length < 2) {
    throw new Error("argument must have at least 2 elements.");
  }
}

/**
  - `utils.and(preds: array (a -> bool)): a -> bool`

      Returns a function which ANDs togther results of passing its argument
      to the given predicates.  For example: `utils.and([f,g,h])(x)` is equivalent
      to `f(x) && g(x) && h(x)`.
*/
function and(preds) {
  checkIsArrayWithAtLeastTwoElems(preds);
  return function (a) {
    for (var p = 0; p < preds.length; p++) {
      if (!preds[p](a)) { return false; }
    }
    return true;
  };
}

/**
  - `utils.or(preds: array (a -> bool)): a -> bool`

      Returns a function which ORs together results of passing its argument
      to the given predicates. For example: `utils.or([f,g,h])(x)` is equivalent
      to `f(x) || g(x) || h(x)`.
*/
function or(preds) {
  checkIsArrayWithAtLeastTwoElems(preds);
  return function (a) {
    for (var p = 0; p < preds.length; p++) {
      if (preds[p](a)) { return true; }
    }
    return false;
  };
}

/**
  - `utils.empty(a): bool`

      Predicate which returns `true` if something is empty. Only
      works with "dimensional" types: string, object, and array.
      If using a custom class, you can also use this predicate
      if your class has a `length` property or getter.
*/
function empty(a) {
  switch (typeof a) {
    case "string":
    case "object": {
      var result;
      switch (typeof a.length) {
        case "number":
        case "function":
          result = force(a.length) === 0;
          break;
        default:
          result = Object.getOwnPropertyNames(a).length === 0;
          break;
      }
      return result;
    }
    default:
      throw new Error("Can't get length of " + a);
  }
}

/**
  - `utils.sample(arb: arbitrary a, n: nat): () -> a`

      Sample a given arbitrary with an optional size.
*/
function sample(arb, optSize) {
  var size = typeof optSize === "number" ? optSize : 10;
  return function () {
    return arb.generator(size);
  };
}

module.exports = {
  isArray: isArray,
  isObject: isObject,
  isEqual: isEqual,
  pluck: pluck,
  force: force,
  merge: merge,
  not: not,
  and: and,
  or: or,
  sample: sample,
  empty: empty,
};
