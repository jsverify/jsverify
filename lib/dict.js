/* @flow weak */
"use strict";

var arbitraryAssert = require("./arbitraryAssert.js");
var array = require("./array.js");
var pair = require("./pair.js");
var string = require("./string.js");
var utils = require("./utils.js");

function makeMapShow(elShow) {
  return function (m) {
    return "{" + Object.keys(m).map(function (k) {
      return k + ": " + elShow(m[k]);
    }).join(", ") + "}";
  };
}

function dict(arb) {
  arb = utils.force(arb);
  arbitraryAssert(arb);

  var pairArbitrary = pair.pair(string.string, arb);
  var arrayArbitrary = array.array(pairArbitrary);

  return arrayArbitrary.smap(utils.pairArrayToDict, utils.dictToPairArray, makeMapShow(arb.show));
}

module.exports = {
  dict: dict,
};
