/* global describe:true, it:true */
"use strict";

var jsc = require("../lib/jsverify.js");

describe("natural numbers", function () {
  it("are greater than or equal to 0", function () {
    var property = jsc.forall("nat", function (n) {
      return n >= 0;
    });

    jsc.assert(property);
  });

  it("are less than 90", function () {
    var property = jsc.forall("nat", function (n) {
      return n < 90;
    });

    jsc.assert(property, { size: 100 });
  });
});
