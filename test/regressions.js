/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../lib/jsverify.js");
var assert = require("assert");

describe("regressions", function () {
  it("#20 - array size and element size is linked", function () {
    var gen = jsc.array(jsc.nat(10000));
    var ok = false;

    var pred = function (x) { return x > 5; };

    for (var i = 0; i < 100; i++) {
      var res = gen.arbitrary(5);
      var larger = res.some(pred);
      if (larger) {
        ok = true;
        break;
      }
    }

    assert(ok, "explicit number size should be decoupled from passed size");
  });
});
