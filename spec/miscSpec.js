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
	});
}());