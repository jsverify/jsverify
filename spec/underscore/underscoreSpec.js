/* global jsc, describe, it, expect, _ */
(function () {
	"use strict";

	function append(l1, l2) {
		return l1.concat(l2);
	}

	function reverse(l) {
		return l.slice().reverse();
	}

	describe("underscore.js", function () {
		describe("collections", function () {
			describe("map", function () {
				it("map_length: length (map f l) = length l", function () {
					expect(jsc.forall(jsc.fun(), jsc.array(), function (f, l) {
						return _.map(l, f).length === l.length;
					})).toHold();
				});

				it("map_app: map f (l ++ l') = map f l ++ map f l'", function () {
					expect(jsc.forall(jsc.fun(), jsc.array(), jsc.array(), function (f, l1, l2) {
						return _.isEqual(_.map(append(l1, l2), f), append(_.map(l1, f), _.map(l2, f)));
					})).toHold();
				});

				it("map_rev: map f (rev l) = rev (map f l)", function () {
					expect(jsc.forall(jsc.fun(), jsc.array(), function (f, l) {
						return _.isEqual(_.map(reverse(l), f), reverse(_.map(l, f)));
					})).toHold();
				});

				it("map_id: map id l = l", function () {
					expect(jsc.forall(jsc.array(), function (l) {
						return _.isEqual(_.map(l, _.identity), l);
					}));
				});

				it("map_map: map g (map f l) = map (g ∘ f) l", function () {
					// g ∘ f == _.compose(g, f)
					expect(jsc.forall(jsc.fun(), jsc.fun(), jsc.array(), function (f, g, l) {
						return _.isEqual(_.map(_.map(l, f), g), _.map(l, _.compose(g, f)));
					})).toHold();
				});
			});
		});

		describe("utility", function () {
			describe("identity", function () {
				it("identity(x) === x", function () {
					expect(jsc.forall(jsc.value(), function (x) {
						return _.identity(x) === x;
					})).toHold();
				});

				it("returns first argument", function () {
					var nonemptylist = jsc.suchthat(jsc.array(), function (l) {
						return l.length !== 0;
					});
					
					expect(jsc.forall(nonemptylist, function (l) {
						return _.identity.apply(undefined, l) === l[0];
					})).toHold();
				});
			});
		});
	});
}());