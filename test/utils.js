/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../lib/jsverify.js");
var _ = require("underscore");
var assert = require("assert");

function exceptionIfThrown(f) {
  try {
    f();
  } catch (e) {
    return e;
  }
  return undefined;
}

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

  describe("sample", function () {
    it("should pass size arg to the generator, or 10 by default", function () {
      var sizeArg;
      var mockArbitrary = {
        generator: function (size) {
          sizeArg = size;
          return "foo";
        }
      };
      assert(jsc.utils.sample(mockArbitrary)() === "foo");
      assert(sizeArg === 10);
      assert(jsc.utils.sample(mockArbitrary, 5)() === "foo");
      assert(sizeArg === 5);
    });
  });

  describe("empty", function () {
    it("should depend on array length", function () {
      jsc.assert(jsc.forall(jsc.array(jsc.json), function (v) {
        return jsc.utils.empty(v) === (v.length === 0);
      }));
    });
    it("should depend on string length", function () {
      jsc.assert(jsc.forall(jsc.string(), function (s) {
        return jsc.utils.empty(s) === (s.length === 0);
      }));
    });
    it("should depend on number of object fields", function () {
      jsc.assert(jsc.forall(jsc.map(jsc.string()), function (o) {
        return jsc.utils.empty(o) === (Object.getOwnPropertyNames(o).length === 0);
      }));
    });
    it("should throw on non-dimensional types or undefined", function () {
      jsc.assert(jsc.forall(jsc.oneof(jsc.bool,
                                      jsc.nat,
                                      jsc.elements([null, undefined])),
                            function (val) {
        return exceptionIfThrown(jsc.utils.empty.bind(undefined, val)) !== undefined;
      }));
    });
  });

  describe("not", function () {
    /* jshint -W018 */
    // ignoring "confusing use of "!'" to ensure we"re comparing
    // the result is equal to `!x` as opposed to `!== x`, which
    // has a broader range of accepted (but incorrect) values
    it("should throw an error when not given a function", function () {
      jsc.assert(jsc.forall(jsc.json, function (o) {
        return exceptionIfThrown(jsc.utils.not(o)) !== undefined;
      }));
    });
    it("should invert a given function", function () {
      jsc.assert(jsc.forall(jsc.fun(jsc.bool), function (f) {
        return jsc.utils.not(f)() === (!f());
      }));
    });
    it("should pass the arguments to the internal fn", function () {
      jsc.assert(jsc.forall(jsc.bool, function (b) {
        return jsc.utils.not(function (x) {return !x;})(b) === (!!b);
      }));
    });
    /* jshint +W018 */
  });

  describe("logical pred combinators", function () {
    var arrayWithAtLeastTwoElems = function (a) {
      return Array.isArray(a) && a.length >= 2;
    };

    // return a function that returns `a`
    var supplierOf = function (a) {
      return function () { return a; };
    };

    // shared behaviors
    var shouldThrowWhenNotGivenArrayWithAtLeastTwoElems = function (testSubject) {
      it("should throw when not given an array with at least 2 elements", function () {
        jsc.assert(jsc.forall(jsc.suchthat(jsc.json,
                                           jsc.utils.not(arrayWithAtLeastTwoElems)),
                              function (fs) {
          return exceptionIfThrown(testSubject.bind(undefined, fs)) !== undefined;
        }));
      });
    };

    // mock predicate which return sa given value and remembers the argument it was called with
    var MockPredicate = function (retVal) {
      this.passedArg = undefined;
      // bind the prediate to this object so that passedArg is set properly
      this.predicate = this.predicate.bind(this);
      this.retVal = retVal;
    };
    MockPredicate.prototype.predicate = function (a) {
      this.passedArg = a;
      return this.retVal;
    };

    // create an array of mock predicates which all return `retVal`
    var createMockPredicates = function (retVal, size) {
      var preds = [];
      for (var i = 0; i < size; i++) {
        preds.push(new MockPredicate(retVal));
      }
      return preds;
    };

    // make all mock predicates return `predResult`
    function shouldPassArgsToInternalPreds(testSubject, predResult) {
      it("should pass the argument of the returned function to the given predicates",
         function () {
           jsc.assert(jsc.forall(jsc.json,
                                 jsc.suchthat(jsc.uint8, function (n) { return n > 1; }),
                                 function (o, n) {
             var mockPreds = createMockPredicates(predResult, n);
             var mockPredFns = mockPreds.map(function (mock) { return mock.predicate; });
             var result = testSubject(mockPredFns)(o);
             // all mock preds `passedArg` should be `o`
             return result === predResult &&
               mockPreds.every(function (mockPred) {
                 return mockPred.passedArg === o;
               });
           }));
         });
    }

    function shouldStopEvaluatingPredsOnResult(testSubject, continueResult, stopResult) {
      it("should immediately return " + stopResult + " when returned by a predicate", function () {
        jsc.assert(jsc.forall(jsc.json,
                              jsc.suchthat(jsc.uint8, function (n) { return n > 1; }),
                              jsc.uint8,
                              function (o, n, stopEarlyIndex) {
          var mockPreds = createMockPredicates(continueResult, n);

          // inject `mockPreds` with a predicate which will cause the testSubjec to exit early
          var wrappedStopEarlyIndex = stopEarlyIndex % (n - 1);
          mockPreds[wrappedStopEarlyIndex] = new MockPredicate(stopResult);

          var mockPredFns = mockPreds.map(function (mock) { return mock.predicate; });

          var result = testSubject(mockPredFns)(o);
          var unvisitedPredIndex;
          mockPreds.forEach(function (mockPred, idx) {
            if (mockPred.passedArg === undefined &&
                unvisitedPredIndex === undefined) {
              unvisitedPredIndex = idx;
            }
          });

          return result === stopResult &&
                 unvisitedPredIndex === (wrappedStopEarlyIndex + 1);
        }));
      });
    }

    describe("and", function () {
      shouldThrowWhenNotGivenArrayWithAtLeastTwoElems(jsc.utils.and);
      // predicates need to return true to ensure they are all visited
      shouldPassArgsToInternalPreds(jsc.utils.and, true);
      // when a predicate returns false, return false immediately
      shouldStopEvaluatingPredsOnResult(jsc.utils.and, true, false);
      it("should return the logical AND of its arguments' results", function () {
        jsc.assert(jsc.forall(
            jsc.suchthat(jsc.array(jsc.bool), arrayWithAtLeastTwoElems),
            function (bs) {
          // if bs.contains(false) is true, then the AND of bs should be false
          return jsc.utils.and(bs.map(supplierOf))(true) !== (bs.indexOf(false) !== -1);
        }));
      });
    });

    describe("or", function () {
      shouldThrowWhenNotGivenArrayWithAtLeastTwoElems(jsc.utils.or);
      // predicates need to return false to ensure they are all visited
      shouldPassArgsToInternalPreds(jsc.utils.or, false);
      // when a predicate returns true, return true immediately
      shouldStopEvaluatingPredsOnResult(jsc.utils.or, false, true);
      it("should return the logical OR of its arguments' results", function () {
        jsc.assert(jsc.forall(
            jsc.suchthat(jsc.array(jsc.bool), arrayWithAtLeastTwoElems),
            function (bs) {
          // if bs.contains(true) is true, then the OR of bs should be true
          return jsc.utils.or(bs.map(supplierOf))(true) === (bs.indexOf(true) !== -1);
        }));
      });
    });
  });
});
