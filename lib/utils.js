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

module.exports = {
  isArray: isArray,
  isObject: isObject,
  isEqual: isEqual,
  pluck: pluck,
  force: force,
  merge: merge,
};
