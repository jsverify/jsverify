/* @flow weak */
"use strict";

/**
  ### Show functions
*/

/**
  - `show.def(x : a): string`
*/
function showDef(obj) {
  return "" + obj;
}

/**
  - `show.tuple(shrinks: (a -> string, b -> string...), x: (a, b...)): string`
*/
function showTuple(shows, objs) {
  var strs = [];
  for (var i = 0; i < shows.length; i++) {
    strs.push(shows[i](objs[i]));
  }
  return strs.join("; ");
}

/**
  - `show.array(shrink: a -> string, x: array a): string`
*/
function showArray(show, arr) {
  return "[" + arr.map(show).join(", ") + "]";
}

module.exports = {
  def: showDef,
  tuple: showTuple,
  array: showArray,
};
