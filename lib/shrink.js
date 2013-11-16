/* jshint node:true */

var assert = require("assert");

function shrinkTuple(generators, tup) {
  assert(generators.length === tup.length, "there should be as much generators as values in the tuple");

  var shrinked = new Array(tup.length);

  for (var i = 0; i < tup.length; i++) {
    /* jshint -W083 */
    shrinked[i] = generators[i].shrink(tup[i]).map(function (x) {
      var c = tup.slice(); // clone array
      c[i] = x;
      return c;
    });
    /* jshint +W083 */
  }

  return Array.prototype.concat.apply([], shrinked);
}

function shrinkArray(generator, arr) {
  if (arr.length === 0) {
    return [];
  } else {
    var x = arr[0];
    var xs = arr.slice(1);

    return [xs].concat(
      generator.shrink(x).map(function (xp) { return [xp].concat(xs); }),
      shrinkArray(generator, xs).map(function (xsp) { return [x].concat(xsp); })
    );
  }
}

module.exports = {
  tuple: shrinkTuple,
  array: shrinkArray,
};