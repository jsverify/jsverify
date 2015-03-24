"use strict";

var assert = require("assert");

/**
  ### sum (n-ary either)

  See: [Wikipedia](https://en.wikipedia.org/wiki/Tagged_union)
*/

function Addend(idx, n, value) {
  assert(n > 0, "Addend: 0 < n"); // empty sum is void - cannot create such
  assert(idx >= 0 && idx < n, "Addend: 0 <= idx < n");
  this.idx = idx;
  this.n = n;
  this.value = value;
}

/**
  - `sum.addend(idx: nat, n: nat, value: a): sum (... a ...)`
*/
function addend(idx, n, value) {
  return new Addend(idx, n, value);
}

/**
  - `.fold(f: (idx: nat, n: nat, value: a) -> b): b`
*/
Addend.prototype.function = function (f) {
  return f(this.idx, this.n, this.value)
}

module.exports = {
  addend: addend,
};
