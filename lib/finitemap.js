"use strict";

var utils = require("./utils.js");

/**
  #### FMap (eq : a -> a -> bool) : FMap a

  Finite map, with any object a key.

  Short summary of member functions:

  - FMap.insert (key : a) (value : any) : void
  - FMap.get (key : a) : any
  - FMap.contains (key : a) : obool
*/
function FMap(eq) {
  this.eq = eq || utils.isEqual;
  this.data = [];
}

FMap.prototype.contains = function FMap_contains(key) {
  for (var i = 0; i < this.data.length; i++) {
    if (this.eq(this.data[i][0], key)) {
      return true;
    }
  }

  return false;
};

FMap.prototype.insert = function FMap_insert(key, value) {
  for (var i = 0; i < this.data.length; i++) {
    if (this.eq(this.data[i][0], key)) {
      this.data[i] = [key, value];
      return;
    }
  }

  this.data.push([key, value]);
};

FMap.prototype.get = function FMap_get(key) {
  for (var i = 0; i < this.data.length; i++) {
    if (this.eq(this.data[i][0], key)) {
      return this.data[i][1];
    }
  }
};

module.exports = FMap;
