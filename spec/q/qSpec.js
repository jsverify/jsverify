/* global Q, jsc, describe, it, expect, waitsFor, runs */
(function () {
	describe("promises: q", function () {
		it("inc", function () {
			function inc(i) {
				return i + 1;
			}

			var propPromise = Q.delay(100).then(function () {
				return jsc.forall(jsc.integer(), function (i) {
					return inc(i) === i + 1;
				});
			});

			// TODO: how to make matcher on promise?
			var done = false;
			propPromise.fin(function () { done = true; });
			waitsFor(function () { return done; });

			runs(function () {
				propPromise.then(function (prop) {
					expect(prop).toHold();
				}, function (e) {
					expect(false).toBe(true); // should be never executed
				});
			});
		});
	});
}());