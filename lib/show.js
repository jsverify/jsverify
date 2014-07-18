"use strict";

function showDef(obj) {
  return "" + obj;
}

function showTuple(shows, objs) {
  var strs = [];
  for (var i = 0; i < shows.length; i++) {
    strs.push(shows[i](objs[i]));
  }
  return strs.join("; ");
}

function showArray(show, arr) {
  return "[" + arr.map(show).join(", ") + "]";
}

module.exports = {
  def: showDef,
  tuple: showTuple,
  array: showArray,
};
