/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../../lib/jsverify.js");

function utilityTest(lib) {
  var _ = require(lib);

  describe(lib + " utility", function () {
    describe("identity", function () {
      it("identity(x) === x", function () {
        jsc.assert(jsc.forall(jsc.value(), function (x) {
          return _.identity(x) === x;
        }));
      });

      it("returns first argument", function () {
        var nonemptylist = jsc.suchthat(jsc.array(), function (l) {
          return l.length !== 0;
        });

        jsc.assert(jsc.forall(nonemptylist, function (l) {
          return _.identity.apply(undefined, l) === l[0];
        }));
      });
    });
  });
}

utilityTest("underscore");
utilityTest("lodash");
