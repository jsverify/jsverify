/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../lib/jsverify.js");
var assert = require("assert");

function checkShrink(mincase, property, tries) {
	tries = tries || 20;
	var wasShrinked = false;

	for (var i = 0; i < tries; i++) {
		var r = jsc.check(property, { quiet: true });
		assert(r !== true, "property should not hold");
		if (mincase !==  undefined) {
			assert.deepEqual(r.counterexample, mincase);
		}
		wasShrinked = wasShrinked || r.shrinks > 0;
	}

	assert(wasShrinked, "should be shrinked");
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
	});

	describe("bool", function () {
		it("shrinks to false", function () {
			checkShrink([false], jsc.forall(jsc.bool(), function (b) {
				return b !== b;
			}));
		});
	});

	describe("pair", function () {
		it("shrinks both elements", function () {
			checkShrink([[false, false]], jsc.forall(jsc.pair(jsc.bool(), jsc.bool()), function (p) {
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
			checkShrink([[1]], jsc.forall(jsc.array(jsc.nat()), function (arr) {
				return arr.length === 0 || arr[0] === 0;
			}));
		});
	});

	describe("nonshrinkarray", function () {
		it("cannot be shrinked", function () {
			var property = jsc.forall(jsc.nonshrinkarray(jsc.nat()), function (arr) {
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

	describe("value", function () {
		it("cannot be shrinked, for now", function () {
			var property = jsc.forall(jsc.value(), function (x) {
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

	describe("function", function () {
		it("cannot be shrinked", function () {
			var property = jsc.forall(jsc.fun(), function (f) {
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

		checkShrink(undefined, property);

		var property2 = jsc.forall(jsc.nat(), jsc.nat(), function (n, m) {
			return n === 0 || m === 0 || m !== m;
		});

		checkShrink([1,1], property2);
	});
});