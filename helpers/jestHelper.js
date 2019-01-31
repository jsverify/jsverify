/* global it: true */
/* eslint strict:[2,"function"] */
var jsc = require("jsverify");

/**
 * wrapper function for using jsverify with jest syntax
 *
 * @param description string describing the test
 * @param arbitrary a jsverify record (or other arbitrary)
 * @param testFn function that expects, in proper jest syntax
 * @param opts options for jsverify
 */
function itHolds(description, arbitrary, testFn, options) {
  "use strict";

  it(description, function () {
    jsc.assert(
      jsc.forall(arbitrary, function (val) {
        testFn(val);
        return true;
      }),
      options
    );
  });
}

module.exports = { itHolds: itHolds };
