"use strict";

var assert = require("assert");

function shrinkNoop() {
  return [];
}

function shrinkTuple(shrinks, tup) {
  assert(shrinks.length === tup.length, "there should be as much shrinks as values in the tuple");

  var shrinked = new Array(tup.length);

  for (var i = 0; i < tup.length; i++) {
    /* jshint -W083 */
    shrinked[i] = shrinks[i](tup[i]).map(function (x) {
      var c = tup.slice(); // clone array
      c[i] = x;
      return c;
    });
    /* jshint +W083 */
  }

  return Array.prototype.concat.apply([], shrinked);
}

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

module.exports = {
  noop: shrinkNoop,
  tuple: shrinkTuple,
  array: shrinkArray,
};
