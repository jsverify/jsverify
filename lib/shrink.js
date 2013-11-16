/* jshint node:true */

var assert = require("assert");

function tuple(generators, tup) {
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

module.exports = {
  tuple: tuple,
};