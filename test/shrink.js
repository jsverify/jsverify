/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../lib/jsverify.js");
var assert = require("assert");
var _ = require("underscore");
var chai = require("chai");

function checkShrinkPredicate(p, property, tries, wasShrinked) {
  tries = tries || 20;
  wasShrinked = !!wasShrinked;

  for (var i = 0; i < tries; i++) {
    var r = jsc.check(property, { quiet: true });
    assert(r !== true, "property should not hold");
    assert(p(r.counterexample));
    wasShrinked = wasShrinked || r.shrinks > 0;
  }

  assert(wasShrinked, "should be shrinked");
}

function checkShrink(mincase, property, tries) {
  function p(x) {
    // TODO: Try to remember why we need this case
    if (mincase === undefined) { return true; }
    return _.isEqual(x, mincase);
  }
  return checkShrinkPredicate(p, property, tries);
}

describe("shrink", function () {
  describe("nat", function () {
    it("shrinks to smaller values", function () {
      checkShrink([0], jsc.forall(jsc.nat(), function (n) {
        return n === n + 1;
      }));
    });
  });

  describe("integer", function () {
    it("shrinks to smaller values", function () {
      checkShrink([0], jsc.forall(jsc.integer(), function (n) {
        return n === n + 1;
      }));
    });

    it("shrinks to smaller values, 2", function () {
      checkShrink([2], jsc.forall(jsc.integer(), function (n) {
        return n < 2 ? true : n === n + 1;
      }));
    });

    it("shrinks to smaller values, 3", function () {
      checkShrink([2], jsc.forall(jsc.integer(5), function (n) {
        return n < 2 ? true : n === n + 1;
      }));
    });

    it("shrinks to smaller values, 4", function () {
      checkShrink([2], jsc.forall(jsc.integer(-1, 5), function (n) {
        return n < 2 ? true : n === n + 1;
      }));
    });
  });

  describe("bool", function () {
    it("true shrinks to false", function () {
      return _.isEqual(jsc.bool.shrink(true), [false]);
    });

    it("false is non-shrinkable", function () {
      return _.isEqual(jsc.bool.shrink(false), []);
    });
  });

  describe("pair", function () {
    it("shrinks both elements", function () {
      checkShrink([[false, false]], jsc.forall(jsc.pair(jsc.bool, jsc.bool), function (p) {
        return p[0] && p[0] !== p[1];
      }));
    });
  });

  describe("suchthat", function () {
    it("shrinks so predicate is true for all shrinked values still", function () {
      var oddNumbers = jsc.suchthat(jsc.nat(), function (n) {
        return n % 2 === 1;
      });

      checkShrink([3], jsc.forall(oddNumbers, function (n) {
        return n < 3 || n !== n;
      }), 100);
    });
  });

  describe("array", function () {
    it("shrinks to smaller arrays", function () {
      checkShrink([[1]], jsc.forall(jsc.array(jsc.nat), function (arr) {
        return arr.length === 0 || arr[0] === 0;
      }));
    });

    describe("bool", function () {
      var shrink = jsc.array(jsc.bool).shrink;

      function check(from, to) {
        return function () {
          var actual = _.chain(shrink(from).toArray()).sort().uniq(_.isEqual).value();
          var expected = _.chain(to).sort().uniq(_.isEqual).value();
          return _.isEqual(actual, expected);
        };
      }

      jsc.property("[false] -> [[]]", check([false], [[]]));
      jsc.property("[true] -> [[], [false]]", check([true], [[false], []]));
      jsc.property("[false, false] -> [[], [false]]", check([true], [[false], []]));
      jsc.property("[false, true] -> [[false], [true], [false, false]]",
        check([false, true], [[true], [false], [false, false]]));
      jsc.property("[true, false] -> [[false], [true], [false, false]]",
        check([true, false], [[true], [false], [false, false]]));
      jsc.property("[true, true] -> [[true], [true, false], [false, true]]",
        check([true, true], [[true], [true, false], [false, true]]));
    });
  });

  describe("string", function () {
    it("shrink of empty string is empty", function () {
      assert(jsc.string.shrink("").length() === 0);
    });

    it("shrinks to smaller strings", function () {
      assert(jsc.string.shrink("foobar").toArray().indexOf("fobar") !== -1);
      assert(jsc.string.shrink("f").toArray().indexOf("") !== -1);
    });
  });

  describe("asciistring", function () {
    it("shrink of empty asciistring is empty", function () {
      assert(jsc.asciistring.shrink("").length() === 0);
    });

    it("shrinks to smaller asciistrings", function () {
      // TODO: implement lazyseq.contains
      assert(jsc.asciistring.shrink("foobar").toArray().indexOf("fobar") !== -1);
      assert(jsc.asciistring.shrink("f").toArray().indexOf("") !== -1);
    });
  });

  describe("nearray", function () {
    jsc.property("shrink of singleton nearray is empty", "nat", function (n) {
      return jsc.nearray(jsc.nat).shrink([n]).length() === 0;
    });

    it("shrinks to smaller nearrays", function () {
      assert(jsc.nearray(jsc.nat).shrink([0, 0]).map(function (x) { return x.join(""); }).toArray().indexOf("0") !== -1);
      assert(jsc.nearray(jsc.nat).shrink([0, 0, 0]).map(function (x) { return x.join(""); }).toArray().indexOf("00") !== -1);

      assert(jsc.shrink.nearray(jsc.nat.shrink)([1, 1]).map(function (x) { return x.join(""); }).toArray().indexOf("1") !== -1);
      assert(jsc.shrink.nearray(jsc.nat.shrink, [1, 1]).map(function (x) { return x.join(""); }).toArray().indexOf("1") !== -1);
    });
  });

  describe("elements", function () {
    var arb = jsc.elements([1, 2, 3]);
    it("shrinks to values towars beginning of the list", function () {
      chai.expect(arb.shrink(1)).to.deep.equal([]);
      chai.expect(arb.shrink(2)).to.deep.equal([1]);
      chai.expect(arb.shrink(3)).to.deep.equal([1, 2]);
      chai.expect(arb.shrink(4)).to.deep.equal([]);
    });
  });

  describe("number", function () {
    it("zero isn't shrinked", function () {
      var arb = jsc.number;
      chai.expect(arb.shrink(0)).to.deep.equal([]);
    });

    it("shrinked to absolutely smaller values", function () {
      var arb = jsc.number;
      var n = 10;
      assert(arb.shrink(n).every(function (x) {
        return Math.abs(x) < n;
      }));
    });

    it("shrinked to absolutely smaller values, 2", function () {
      var n = 10;
      var arb = jsc.number(n);
      assert(arb.shrink(n).every(function (x) {
        return Math.abs(x) < n;
      }));
    });

    it("shrinked to absolutely smaller values, 3", function () {
      var n = 10;
      var m = 5;
      var arb = jsc.number(m, n);
      assert(arb.shrink(n).every(function (x) {
        return x >= m && x < n;
      }));
    });
  });

  describe("datetime", function () {
    it("shrinked days stay in the interval", function () {
      var from = new Date("Sun Nov 30 2014 10:00:00 GMT+0200 (EET)");
      var to = new Date("Sun Nov 30 2014 14:00:00 GMT+0200 (EET)");
      var arb = jsc.datetime(from, to);
      var date = new Date("Sun Nov 30 2014 11:00:00 GMT+0200 (EET)");
      assert(arb.shrink(date).every(function (x) {
        return from.getTime() <= x.getTime() && x.getTime() <= to.getTime();
      }));
    });
  });

  describe("nonshrink array", function () {
    it("cannot be shrinked", function () {
      var property = jsc.forall(jsc.nonshrink(jsc.array(jsc.nat())), function (arr) {
        return arr.length === 0 || arr[0] === 0;
      });

      // try many times to get more examples
      for (var i = 0; i < 10; i++) {
        var r = jsc.check(property, { quiet: true });
        assert(r !== true);
        assert(r.shrinks === 0);
      }
    });
  });

  describe("dict", function () {
    it("shrinks to smaller dicts", function () {
      checkShrink([{ "": 1 }], jsc.forall(jsc.dict(jsc.nat()), function (m) {
        return _.size(m) === 0 || _.some(m, function (value) { return value === 0; });
      }));
    });
  });

  describe("record", function () {
    it("shrinks as tuple", function () {
      checkShrink([{ a: 0, b: [] }], jsc.forall("{ a: nat; b: [bool] }", function (record) {
        return record.a === record.a + 1;
      }));
    });

    it("is auto-curried", function () {
      var natShrink = jsc.nat().shrink;
      var prop = jsc.forall("nat", function (n) {
        var a = jsc.shrink.record({ key: natShrink }, { key: n });
        var b = jsc.shrink.record({ key: natShrink })({ key: n });

        return _.isEqual(a, b);
      });

      jsc.assert(prop);
    });

    it("is auto-curried, nat acts as object too!", function () {
      var natShrink = jsc.nat.shrink;
      var prop = jsc.forall("nat", function (n) {
        var a = jsc.shrink.record({ key: natShrink }, { key: n });
        var b = jsc.shrink.record({ key: natShrink })({ key: n });

        return _.isEqual(a, b);
      });

      jsc.assert(prop);
    });
  });

  describe("json", function () {
    it("cannot be shrinked, for now", function () {
      var property = jsc.forall(jsc.json, function (x) {
        return x !== x;
      });

      // try many times to get more examples
      for (var i = 0; i < 10; i++) {
        var r = jsc.check(property, { quiet: true });
        assert(r !== true);
        assert(r.shrinks === 0);
      }
    });
  });

  describe("smap", function () {
    it("transforms shrinks", function () {
      var neg = function (x) { return -x; };
      var shrink = jsc.nat().shrink.smap(neg, neg);

      var shrinked = shrink(10);
      assert(shrinked.every(function (x) {
        return x <= 0;
      }));
    });

    it("smap ∘ smap", function () {
      var neg = function (n) { return -n; };
      var f = function (n) { return n + 1; };
      var g = function (n) { return n - 1; };

      var shrink1 = jsc.nat().shrink.smap(neg, neg).smap(f, g);
      // →: f ∘ neg
      // ← neg ∘ g
      // neg⁻¹ ≡ neg
      // f⁻¹ ≡ f
      var shrink2 = jsc.nat().shrink.smap(_.compose(f, neg), _.compose(neg, g));

      jsc.assert(jsc.forall(jsc.nat(), function (i) {
        var j = f(neg(i));
        var a = shrink1(j);
        var b = shrink2(j);

        return _.isEqual(a, b);
      }));
    });
  });

  describe("function", function () {
    it("cannot be shrinked", function () {
      var property = jsc.forall(jsc.fn(), function (f) {
        return f(0) !== f(0);
      });

      // try many times to get more examples
      for (var i = 0; i < 10; i++) {
        var r = jsc.check(property, { quiet: true });
        assert(r !== true);
        assert(r.shrinks === 0);
      }
    });
  });

  describe("recursive definitions", function () {
    // TODO: jsverify doesn't find minimal 1, 1 case in recursive setting
    // this "monadic" bind is hard
    var property = jsc.forall(jsc.nat(), function (n) {
      return jsc.forall(jsc.nat(), function (m) {
        return n === 0 || m === 0 || m !== m;
      });
    });

    it("find minimal", function () {
      checkShrink(undefined, property);

      var property2 = jsc.forall(jsc.nat(), jsc.nat(), function (n, m) {
        return n === 0 || m === 0 || m !== m;
      });

      checkShrink([1, 1], property2);
    });
  });

  describe("issue #99", function () {
    it("shrinks a pair so predicate is true for all shrinked values still", function () {
      var smallAndBigPair = jsc.suchthat(jsc.pair(jsc.nat(), jsc.nat()), function (pair) {
        return pair[0] <= pair[1];
      });

      // shrinked value is [[x,x]] for some x : nat.
      // We'd like to shrink back to [0, 0], but it's impossible with current shrink implementation for pair.
      function p(x) {
        return x[0][0] === x[0][1];
      }

      checkShrinkPredicate(p, jsc.forall(smallAndBigPair, function (pair) {
        return pair[0] < pair[1];
      }), 100, true);
    });
  });
});
