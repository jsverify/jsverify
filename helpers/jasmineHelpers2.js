/* global jasmine:true, beforeEach:true, jsc:true, Promise:true */
/* eslint strict:[2,"function"] */
beforeEach(function () {
  "use strict";

  function message(r) {
    return "Expected property to hold. Counterexample found: " + r.counterexamplestr;
  }

  jasmine.addMatchers({
    toHold: function () {
      return {
        compare: function (actual, done) {
          var r = jsc.check(actual);
          if (done) {
            Promise.resolve().then(function () { return r; }).then(function (v) {
              if (v === true) {
                done();
              } else {
                done.fail(message(v));
              }
            });
            return {
              pass: true,
            };
          }
          return {
            pass: r === true,
            message: message(r),
          };
        },
      };
    },
  });
});
