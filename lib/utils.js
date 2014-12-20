/* @flow weak */
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

function identity(x) {
  return x;
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

function curried2(result, args) {
  if (args.length === 2) {
    return result(args[1]);
  } else {
    return result;
  }
}

function charArrayToString(arr) {
  return arr.join("");
}

function stringToCharArray(str) {
  return str.split("");
}

module.exports = {
  isArray: isArray,
  isObject: isObject,
  isEqual: isEqual,
  identity: identity,
  pluck: pluck,
  force: force,
  merge: merge,
  div2: div2,
  curried2: curried2,
  charArrayToString: charArrayToString,
  stringToCharArray: stringToCharArray,
};
