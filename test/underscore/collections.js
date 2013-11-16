/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../../lib/jsverify.js");

function append(l1, l2) {
  return l1.concat(l2);
}

function reverse(l) {
  return l.slice().reverse();
}

function collectionsTest(lib) {
  var _ = require(lib);

  describe(lib + " collections", function () {
    describe("map", function () {
      it("map_length: length (map f l) = length l", function () {
        jsc.assert(jsc.forall(jsc.fun(), jsc.array(), function (f, l) {
          return _.map(l, f).length === l.length;
        }));
      });

      it("map_app: map f (l ++ l') = map f l ++ map f l'", function () {
        jsc.assert(jsc.forall(jsc.fun(), jsc.array(), jsc.array(), function (f, l1, l2) {
          return _.isEqual(_.map(append(l1, l2), f), append(_.map(l1, f), _.map(l2, f)));
        }));
      });

      it("map_rev: map f (rev l) = rev (map f l)", function () {
        jsc.assert(jsc.forall(jsc.fun(), jsc.array(), function (f, l) {
          return _.isEqual(_.map(reverse(l), f), reverse(_.map(l, f)));
        }));
      });

      it("map_id: map id l = l", function () {
        jsc.assert(jsc.forall(jsc.array(), function (l) {
          return _.isEqual(_.map(l, _.identity), l);
        }));
      });

      it("map_map: map g (map f l) = map (g ∘ f) l", function () {
        // g ∘ f == _.compose(g, f)
        jsc.assert(jsc.forall(jsc.fun(), jsc.fun(), jsc.array(), function (f, g, l) {
          return _.isEqual(_.map(_.map(l, f), g), _.map(l, _.compose(g, f)));
        }));
      });
    });

    describe("filter", function () {
      it("filter_in", function () {
        jsc.assert(jsc.forall(jsc.fun(), jsc.array(), function (f, l) {
          var filtered = _.filter(l, f);

          // In x (filter f l) <-> In x l /\ f x = true
          return _.every(filtered, f) && _.every(filtered, function (x) {
            return _.contains(l, x);
          });
        }));
      });
    });

    describe("reject", function () {
      it("is filter with negated predicate", function () {
        jsc.assert(jsc.forall(jsc.fun(), jsc.array(), function (f, l) {
          return _.isEqual(_.filter(l, f), _.reject(l, function (x) {
            return !f(x);
          }));
        }));
      });

      it("produces disjoint set of filter", function () {
        jsc.assert(jsc.forall(jsc.fun(), jsc.array(), function (f, l) {
          var filtered = _.filter(l, f);
          var rejected = _.reject(l, f);

          // every element of l is either in filtered or rejected
          // but not in both
          return filtered.length + rejected.length === l.length &&
            _.every(l, function (x) {
              var inf = _.contains(filtered, x);
              var inr = _.contains(rejected, x);

              return (inf || inr) && (inf !== inr);
            });
        }));
      });
    });
  });
}

collectionsTest("underscore");
collectionsTest("lodash");
