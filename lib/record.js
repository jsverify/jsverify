"use strict";

var arbitrary = require("./arbitrary.js");
var environment = require("./environment.js");
var typify = require("./typify.js");
var utils = require("./utils.js");

/**
  - `record(spec: { key: arbitrary a... }, userenv: env?): arbitrary { key: a... }`

      Generates a javascript object with given record spec.
*/
function record(spec, userenv) {
  var env = userenv ? utils.merge(environment, userenv) : environment;

  var parsedSpec = {};
  Object.keys(spec).forEach(function (k) {
    var arb = spec[k];
    parsedSpec[k] = typeof arb === "string" ? typify.parseTypify(env, arb) : arb;
  });

  return arbitrary.record(parsedSpec);
}

module.exports = record;
