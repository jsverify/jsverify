import * as jsc from "../lib/jsverify.js";

describe("throws", function () {
  jsc.property("example 1", "bool", function (b) {
    var block = function () {
      if (b) { throw new Error("foo"); }
    };

    return jsc.throws(block) === b;
  });

  jsc.property("class", "bool", function (b) {
    var block = function () {
      throw (b ? new Error("foo") : "foo");
    };

    return jsc.throws(block, Error) === b;
  });

  jsc.property("message", "bool", "string", function (b, msg) {
    var block = function () {
      throw (b ? new Error(msg) : "other-error");
    };

    // Cast is need becaused Node's typings augment the type of the Error
    // constructor without correctly indicating that those augmentations
    // are available on the RangeError constructor too. E.g.,
    // RangeError.captureStackTrace works.
    return jsc.throws(block, <typeof Error>RangeError, msg) === b;
  });
});
