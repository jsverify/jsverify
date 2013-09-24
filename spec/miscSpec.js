/* global jsc, describe, it, expect */
(function () {
	"use strict";

	describe("miscellaneous functions", function () {
		describe("id", function () {
			it("forall x, x = id x", function () {
				var prop = jsc.forall(jsc.value(), function (x) {
					return jsc._.isEqual(x, jsc._.id(x));
				});

				expect(prop).toHold();
			});
		});

		describe("isEqual", function () {
			it("is reflexive", function () {
				var prop = jsc.forall(jsc.value(), function (x) {
					return jsc._.isEqual(x, x);
				});

				expect(prop).toHold();
			});
		});

		describe("FMap", function () {
			it("works as object for integer keys", function () {
				var prop = jsc.forall(jsc.array(jsc.pair(jsc.integer())), function (l) {
					var m = new jsc._.FMap();
					var o = {};

					l.forEach(function (p) {
						m.insert(p[0], p[1]);
						o[p[0]] = p[1];
					});

					return Object.keys(o).every(function (k) {
						return o[k] === m.get(parseInt(k, 10));
					});
				});

				expect(prop).toHold();
			});
		});
	});
}());