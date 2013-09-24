/* global jsc, describe, it, expect */
(function () {
	"use strict";

	describe("generators", function () {
		describe("fun", function () {
			it("returns identically the same value for same parameter", function () {
				var prop = jsc.forall(jsc.fun(), jsc.value(), function (f, x) {
					return f(x) === f(x);
				});

				expect(prop).toHold();
			});
		});
	});
}());