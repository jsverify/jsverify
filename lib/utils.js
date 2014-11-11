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
  - `utils.not(a... -> b): a... -> bool`

      An inverted version of the given function. For example,
      `utils.not(utils.isArray)` will return a function that returns `true`
      when soemthing is _not_ an array.
*/
function not(x) {
  return function () {
    return !x.apply(undefined, arguments);
  };
}

/**
  - `utils.and(preds: array (a -> bool)): a -> bool`

      Returns a function which ANDs togther results of passing its argument
      to the given predicates.  For example: `utils.and([f,g,h])(x)` is equivalent
      to `f(x) && g(x) && h(x)`.
*/
function and(preds) {
  var len = preds.length;
  var res = function (x) {
    for (var p = 0; p < len; p++) {
      if (!preds[p](x)) { return false; }
    }
    return true;
  };

  if (arguments.length === 2) {
    return res(arguments[1]);
  } else {
    return res;
  }
}

/**
  - `utils.or(preds: array (a -> bool)): a -> bool`

      Returns a function which ORs together results of passing its argument
      to the given predicates. For example: `utils.or([f,g,h])(x)` is equivalent
      to `f(x) || g(x) || h(x)`.
*/
function or(preds) {
  var len = preds.length;
  var res = function (x) {
    for (var p = 0; p < len; p++) {
      if (preds[p](x)) { return true; }
    }
    return false;
  };

  if (arguments.length === 2) {
    return res(arguments[1]);
  } else {
    return res;
  }
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
};
