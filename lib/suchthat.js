"use strict";

var environment = require("./environment.js");
var typify = require("./typify.js");
var utils = require("./utils.js");
var suchthatImpl = require("./suchthat-impl.js").suchthatImpl;

/**
  - `suchthat(arb: arbitrary a, p : a -> bool): arbitrary a`
      Arbitrary of values that satisfy `p` predicate. It's advised that `p`'s accept rate is high.
*/
function suchthat(arb, userenv, predicate) {
  var env;
  if (arguments.length === 2) {
    predicate = userenv;
    env = environment;
  } else {
    env = utils.merge(environment, userenv);
  }

  arb = typeof arb === "string" ? typify.parseTypify(env, arb) : arb;
  arb = utils.force(arb);

  return suchthatImpl(arb, predicate);
}

module.exports = {
  suchthat: suchthat,
};
