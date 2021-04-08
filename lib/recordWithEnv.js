"use strict";

var environment = require("./environment.js");
var record = require("./record.js");
var typify = require("./typify.js");
var utils = require("./utils.js");

/**
  ### Arbitrary records

  - `record(spec: { key: arbitrary a... }, userenv: env?): arbitrary { key: a... }`

      Generates a javascript object with given record spec.

  ```js
  > const obj = jsc.record({ "n": jsc.nat(100), "b": jsc.bool })
  > obj.generator()
  { n: 99, b: false }
  > obj.generator()
  { n: 28, b: true }
  > obj.generator()
  { n: 4, b: false }
  ```
*/
function recordWithEnv(spec, userenv) {
  var env = userenv ? utils.merge(environment, userenv) : environment;

  var parsedSpec = {};
  Object.keys(spec).forEach(function (k) {
    var arb = spec[k];
    parsedSpec[k] = typeof arb === "string" ? typify.parseTypify(env, arb) : arb;
  });

  return record.arbitrary(parsedSpec);
}

module.exports = recordWithEnv;
