/* global jsc, _, Q, describe, it, expect, waitsFor, runs */
(function () {
	"use strict";

	describe("examples", function () {
		it("collatz conjecture", function () {
			function collatz(n) {
				while (true) {
					if (n === 1) {
						break;
					} else if (n % 2 === 0) {
						n = n / 2;
					} else {
						n = 3 * n + 1;
					}
				}
			}

			var prop = jsc.forall(jsc.suchthat(jsc.nat(), function (n) { return n > 0; }), function (n) {
				// if collatz loop forever, we never return and test eventually fails
				collatz(n);
				return true;
			});

			expect(prop).toHold();
		});

		it("forall (f : bool -> bool) (b : bool), f (f (f b)) = f b", function () {
			var prop = jsc.forall(jsc.fun(jsc.bool()), jsc.bool(), function (f, b) {
				return f(f(f(b))) === f(b);
			});

			expect(prop).toHold();
		});

		it("failing inc", function () {
			function inc(i) {
				return i + 1;
			}

			var prop = jsc.forall(jsc.integer(), function (i) {
				return inc(i) === i + 2;
			});

			expect(prop).not.toHold();
		});

		it("fixed inc", function () {
			function inc(i) {
				return i + 1;
			}

			var prop = jsc.forall(jsc.integer(), function (i) {
				return inc(i) === i + 1;
			});

			expect(prop).toHold();
		});

		it("fixed inc - promise", function () {
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

		it("failing add", function () {
			function add(i, j) {
				return i + (j && 1);
			}

			var prop = jsc.forall(jsc.integer(), function (i) {
				return jsc.forall(jsc.integer(), function (j) {
					return add(i, j) === i + j;
				});
			});

			expect(prop).not.toHold();
		});

		it("other failing add", function () {
			function add(i, j) {
				return i + (j && 1);
			}

			var prop = jsc.forall(jsc.integer(), jsc.integer(), function (i, j) {
				return add(i, j) === i + j;
			});

			expect(prop).not.toHold();
		});

		it("fixed add", function () {
			function add(i, j) {
				return i + j;
			}

			var prop = jsc.forall(jsc.integer(), function (i) {
				return jsc.forall(jsc.integer(), function (j) {
					return add(i, j) === i + j;
				});
			});

			expect(prop).toHold();
		});

		it("failing add3", function () {
			function add(i, j, k) {
				return i + (j && 1) + k;
			}

			var prop = jsc.forall(jsc.integer(), function (i) {
				return jsc.forall(jsc.integer(), function (j) {
					return jsc.forall(jsc.integer(), function (k) {
						return add(i, j, k) === i + j + k;
					});
				});
			});

			expect(prop).not.toHold();
		});

		it("intersects", function () {
			function contains(arr, x) {
				return arr.indexOf(x) !== -1;
			}

			function intersects(a, b) {
				return a.some(function (x) {
					return contains(b, x);
				});
			}

			var prop = jsc.forall(jsc.nonshrinkarray(), function (a) {
				return jsc.forall(jsc.nonshrinkarray(), function (b) {
					return intersects(a, b) === (_.intersection(a, b) !== []);
				});
			});

			expect(prop).not.toHold();

			var prop2 = jsc.forall(jsc.array(), function (a) {
				return jsc.forall(jsc.array(), function (b) {
					return intersects(a, b) === (_.intersection(a, b) !== []);
				});
			});

			expect(prop2).not.toHold();

			var prop3 = jsc.forall(jsc.array(), function (a) {
				return jsc.forall(jsc.array(), function (b) {
					return intersects(a, b) === (_.intersection(a, b).length !== 0);
				});
			});

			expect(prop3).toHold();

			/*
			var prop4 = jsc.forall(jsc.array(), function (a) {
				return jsc.forall(jsc.array(), function (b) {
					return q.delay(10).then(function () {
						return intersects(a, b) === (_.intersection(a, b).length !== 0);
					});
				});
			});

			jsc.check(prop4).then(function (res) {
				console.log("intersects try 4:", res);
			});
			*/
		});

		it("booleans", function () {
			var true_and_left_prop = jsc.forall(jsc.bool(), function (x) {
				return true && x === x;
			});

			expect(true_and_left_prop).toHold();

			var true_and_right_prop = jsc.forall(jsc.bool(), function (x) {
				return x && true === x;
			});

			expect(true_and_right_prop).not.toHold(); // be careful!


			var true_and_right_fixed_prop = jsc.forall(jsc.bool(), function (x) {
				return (x && true) === x;
			});

			var true_and_left_fixed_prop = jsc.forall(jsc.bool(), function (x) {
				return (true && x) === x;
			});

			expect(true_and_right_fixed_prop).toHold();
			expect(true_and_left_fixed_prop).toHold();
		});

		it("oneof", function () {
			var prop1 = jsc.forall(jsc.oneof(["foo", "bar", "quux"]), function (el) {
				return _.contains(["foo", "bar"], el);
			});

			expect(prop1).not.toHold();

			var prop2 = jsc.forall(jsc.oneof(["foo", "bar", "quux"]), function (el) {
				return _.contains(["foo", "bar", "quux"], el);
			});

			expect(prop2).toHold();
		});

		it("suchthat", function () {
			function isOdd(n) {
				return n % 2 === 1;
			}

			var oddInteger = jsc.suchthat(jsc.integer(), isOdd);

			var odd_mult_odd_is_odd_property = jsc.forall(oddInteger, oddInteger, function (x, y) {
				return isOdd(x * y);
			});

			expect(odd_mult_odd_is_odd_property).toHold();
		});

		it("array indexOf", function () {
			var nonemptyarray = jsc.suchthat(jsc.array(), function (l) {
				return l.length !== 0;
			});

			var prop = jsc.forall(nonemptyarray, function (l) {
				return jsc.forall(jsc.oneof(l), function (x) {
					return l.indexOf(x) !== -1;
				});
			});

			expect(prop).toHold();
		});

		it("numbers", function () {
			var nat_nonnegative_prop = jsc.forall(jsc.nat(), function (n) {
				return n >= 0;
			});

			expect(nat_nonnegative_prop).toHold();

			var integer_round_noop_property = jsc.forall(jsc.integer(), function (n) {
				return Math.round(n) === n;
			});

			expect(integer_round_noop_property).toHold();

			var number_round_noop_property = jsc.forall(jsc.number(), function (n) {
				return Math.round(n) === n;
			});

			expect(number_round_noop_property).not.toHold();
		});

		it("_.sortBy idempotent", function () {
			var prop1 = jsc.forall(jsc.array(), function (l) {
				return _.isEqual(_.sortBy(l), l);
			});

			expect(prop1).toHold();

			function sort(l) {
				return _.sortBy(l, _.identity);
			}

			var prop2 = jsc.forall(jsc.array(), function (l) {
				return _.isEqual(sort(l), l);
			});

			expect(prop2).not.toHold();

			var prop3 = jsc.forall(jsc.array(), function (l) {
				return _.isEqual(sort(sort(l)), sort(l));
			});

			expect(prop3).toHold();
		});
	});
}());
