"use strict";

var assert = require("assert");

/**
  ### Shrink functions
*/

/**
  - `shrink.noop(x: a): array a`
*/
function shrinkNoop() {
  return [];
}

/**
  - `shrink.tuple(shrinks: (a -> array a, b -> array b...), x: (a, b...)): array (a, b...)`
*/
function shrinkTuple(shrinks, tup) {
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
}

/**
  - `shrink.array(shrink: a -> array a, x: array a): array (array a)`
*/
function shrinkArray(shrink, arr) {
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
}

/**
  - `shrink.record(shrinks: { key: a -> string... }, x: { key: a... }): array { key: a... }`
*/
function shrinkRecord(shrinksRecord, record) {
  var keys = Object.keys(record);
  var values = keys.map(function (k) { return record[k]; });
  var shrinks = keys.map(function (k) { return shrinksRecord[k]; });

  var shrinked = shrinkTuple(shrinks, values);

  return shrinked.map(function (s) {
    var result = {};
    keys.forEach(function (k, i) {
      result[k] = s[i];
    });
    return result;
  });
}

module.exports = {
  noop: shrinkNoop,
  tuple: shrinkTuple,
  array: shrinkArray,
  record: shrinkRecord,
};
