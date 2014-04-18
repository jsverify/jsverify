/* global jsc, describe, it, expect */
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
      var prop = jsc.forall(jsc.fn(jsc.bool()), jsc.bool(), function (f, b) {
        return f(f(f(b))) === f(b);
      });

      expect(prop).toHold();
    });

    it("failing test", function () {
      function inc(i) {
        return i + 1;
      }

      var prop = jsc.forall(jsc.integer(), function (i) {
        return inc(i) === i + 2;
      });

      expect(prop).not.toHold();
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
        return ["foo", "bar"].indexOf(el) !== -1;
      });

      expect(prop1).not.toHold();

      var prop2 = jsc.forall(jsc.oneof(["foo", "bar", "quux"]), function (el) {
        return ["foo", "bar", "quux"].indexOf(el) !== -1;
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

    it("sort idempotent", function () {
      function sort(l) {
        return l.slice().sort();
      }

      var prop1 = jsc.forall(jsc.array(), function (l) {
        return jsc._.isEqual(sort(l), l);
      });

      expect(prop1).not.toHold();

      var prop2 = jsc.forall(jsc.array(), function (l) {
        return jsc._.isEqual(sort(sort(l)), sort(l));
      });

      expect(prop2).toHold();
    });

    it("assert throws if property doesn't hold", function () {
      var prop = jsc.forall(jsc.number(), function (n) {
        return n === n + 1;
      });

      expect(function () {
        jsc.assert(prop);
      }).toThrow();
    });
  });
}());
