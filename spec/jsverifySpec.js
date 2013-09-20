/* global jsc, _, describe, it, expect, beforeEach */
(function () {
  "use strict";

  beforeEach(function () {
    this.addMatchers({
      // Expects that property is synchronous
      toHold: function () {
        var actual = this.actual;
        var notText = this.isNot ? " not" : "";

        var r = jsc.check(actual);

        var counterExampleText = r === true ? "" : "Counter example found: " + JSON.stringify(r.counterexample);

        this.message = function() {
            return "Expected property to " + notText + " to not hold." + counterExampleText;
        };

        return r === true;
      },
    });
  });

  describe("examples", function () {
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

      var prop = jsc.forall(jsc.nonshrinklist(), function (a) {
          return jsc.forall(jsc.nonshrinklist(), function (b) {
              return intersects(a, b) === (_.intersection(a, b) !== []);
          });
      });

      expect(prop).not.toHold();

      var prop2 = jsc.forall(jsc.list(), function (a) {
          return jsc.forall(jsc.list(), function (b) {
              return intersects(a, b) === (_.intersection(a, b) !== []);
          });
      });

      expect(prop2).not.toHold();

      var prop3 = jsc.forall(jsc.list(), function (a) {
          return jsc.forall(jsc.list(), function (b) {
              return intersects(a, b) === (_.intersection(a, b).length !== 0);
          });
      });

      expect(prop3).toHold();

      /*
      var prop4 = jsc.forall(jsc.list(), function (a) {
          return jsc.forall(jsc.list(), function (b) {
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
  });
}());
