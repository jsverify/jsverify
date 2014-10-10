/* global jasmine:true, beforeEach:true, jsc:true */
beforeEach(function () {
  "use strict";
  jasmine.addMatchers({
    // Expects that property is synchronous
    toHold: function () {
      return {
        compare: function (actual) {
          /* global window */
          var quiet = window && !(/verbose=true/).test(window.location.search);

          var r = jsc.check(actual, { quiet: quiet });

          var pass = r === true;
          var message;

          if (pass) {
            message = "Expected property to hold. Counterxample found: " + r.counterexamplestr;
          } else {
            message = "Expected property to not hold.";
          }

          return {
            pass: pass,
            message: message,
          };
        }
      };
    },
  });
});
