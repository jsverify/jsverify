/* @flow weak */
"use strict";

var environment = require("./environment.js");
var typify = require("./typify.js");
var utils = require("./utils.js");
var generator = require("./generator.js");
var shrink = require("./shrink.js");
var arbitraryBless = require("./arbitraryBless.js");

/**
  ### Restricting arbitraries

  - `suchthat(arb: arbitrary a, userenv: env?, p : a -> bool): arbitrary a`
      Arbitrary of values that satisfy `p` predicate. It's advised that `p`'s accept rate is high.

  ```js
  > const evenNat = jsc.suchthat(jsc.nat(100), n => n % 2 == 0)
  > evenNat.generator()
  32
  > evenNat.generator()
  84
  > evenNat.generator()
  96
  ```
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

  return arbitraryBless({
    generator: generator.bless(function (size) {
      for (var i = 0; ; i++) {
        // if 5 tries failed, increase size
        if (i > 5) {
          i = 0;
          size += 1;
        }

        var x = arb.generator(size);
        if (predicate(x)) {
          return x;
        }
      }
    }),

    shrink: shrink.bless(function (x) {
      return arb.shrink(x).filter(predicate);
    }),

    show: arb.show,
  });
}

module.exports = {
  suchthat: suchthat,
};
