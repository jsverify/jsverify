/* global jsc, describe, it, expect, _ */
(function () {
	"use strict";

	describe("intersection", function () {
		it("intersects", function () {
			function contains(arr, x) {
				return arr.indexOf(x) !== -1;
			}

			function intersects(a, b) {
				return a.some(function (x) {
					return contains(b, x);
				});
			}

			var prop = jsc.forall(jsc.array(), function (a) {
				return jsc.forall(jsc.array(), function (b) {
					return intersects(a, b) === (_.intersection(a, b).length !== 0);
				});
			});

			expect(prop).toHold();
		});
	});
}());
