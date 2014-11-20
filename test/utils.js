/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../lib/jsverify.js");
var _ = require("underscore");

describe("jsc.utils", function () {
  describe("merge", function () {
    it("≡ _.extend({}, ...", function () {
      jsc.assert(jsc.forall("map", "map", function (x, y) {
        var a = jsc.utils.merge(x, y);
        var b = _.extend({}, x, y);
        return _.isEqual(a, b);
      }));
    });
  });
});
