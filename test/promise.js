/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../lib/jsverify.js");

function promiseSpec(library, delay) {
  var promise = require(library);

  describe("promise: " + library, function () {
    it("check", function (done) {
      var p = jsc.check(jsc.forall(jsc.nat(), function (n) {
        return delay(promise).then(function () {
          return n === n;
        });
      }));

      p.then(function (r) {
        if (r === true) {
          done();
        } else {
          done(r);
        }
      });
    });

    it("recursive", function (done) {
      var p = jsc.check(jsc.forall(jsc.nat(), function (n) {
        return jsc.forall(jsc.nat(), function (m) {
          return delay(promise).then(function () {
            return n === m;
          });
        });
      }));

      p.then(function (r) {
        if (r === true) {
          done("error");
        } else {
          done();
        }
      });
    });

    it("fail", function (done) {
      var p = jsc.check(jsc.forall(jsc.nat(), function (/* n */) {
        return delay(promise).then(function () {
          throw new Error("fail always");
        });
      }));

      p.then(function (r) {
        if (r === true) {
          done("error");
        } else {
          done();
        }
      });
    });
  });
}

promiseSpec("q", function (q) { return q.delay(1); });
promiseSpec("when", function (when) { return when.resolve().delay(1); });
promiseSpec("bluebird", function (Bluebird) { return Bluebird.resolve().delay(1); });
