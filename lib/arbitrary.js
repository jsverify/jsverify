/* jshint node: true */
"use strict";

var random = require("./random.js");

function arbitraryArray(arbitrary, size) {
  var arrsize = random(0, size);
  var arr = new Array(arrsize);
  for (var i = 0; i < arrsize; i++) {
    arr[i] = arbitrary(size);
  }
  return arr;
}

function arbitraryString(size) {
  return arbitraryArray(function () {
    return String.fromCharCode(random(0, 0xff));
  }, size).join("");
}

function arbitraryObject(arbitrary, size) {
  var objsize = random(0, size);
  var obj = {};
  for (var i = 0; i < objsize; i++) {
    obj[arbitraryString(size)] = arbitrary(size);
  }
  return obj;
}

module.exports = {
  array: arbitraryArray,
  string: arbitraryString,
  object: arbitraryObject,
};
