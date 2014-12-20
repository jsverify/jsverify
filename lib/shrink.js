/* @flow weak */
"use strict";

var assert = require("assert");
var utils = require("./utils.js");

/**
  ### Shrink functions
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

function shrinkBless(shrink) {
  shrink.isomap = shrinkProtoIsoMap;
  return shrink;
}

/**
  - `shrink.noop(x: a): array a`
*/
var shrinkNoop = shrinkBless(function shrinkNoop() {
  return [];
});

/**
  - `shrink.tuple(shrinks: (a -> array a, b -> array b...), x: (a, b...)): array (a, b...)`
*/
function shrinkTuple(shrinks) {
  var result = shrinkBless(function (tup) {
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
  });

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
  - `shrink.array(shrink: a -> array a, x: array a): array (array a)`
*/
var shrinkArray = shrinkArrayWithMinimumSize(0);

/**
  - `shrink.nearray(shrink: a -> nearray a, x:  nearray a): array (nearray a)`
*/
var shrinkNEArray = shrinkArrayWithMinimumSize(1);

/**
  - `shrink.record(shrinks: { key: a -> string... }, x: { key: a... }): array { key: a... }`
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
  tuple: shrinkTuple,
  array: shrinkArray,
  nearray: shrinkNEArray,
  record: shrinkRecord,
  bless: shrinkBless,
};
