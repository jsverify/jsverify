/* global jsc, describe, it, expect */
(function () {
	"use strict";

	describe("generators", function () {
		describe("fun", function () {
			it("returns identically the same value for same parameter", function () {
				var prop = jsc.forall(jsc.pair(jsc.fun(), jsc.value()), function (p) {
					var f = p[0];
					var x = p[1];

					return f(x) === f(x);
				});

				expect(prop).toHold();
			});
		});
	});
}());