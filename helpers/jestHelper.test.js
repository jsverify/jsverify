/* global describe:true, expect:true */
/* eslint strict:[2,"function"] */

var jsc = require("jsverify");
var itHolds = require("./jestHelper").itHolds;

describe("a simple jsverify test", function () {
  "use strict";

  itHolds("(b && b) === b", jsc.bool, function (b) {
    expect(b && b).toBe(b);
  });
});
