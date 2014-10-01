"use strict";

var shrink = require("./shrink.js");
var generator = require("./generator.js");

/**
  ### Generator combinators
*/

/**
  #### suchthat (gen : generator a) (p : a -> bool) : generator {a | p a == true}

  Generator of values that satisfy `p` predicate. It's adviced that `p`'s accept rate is high.
*/
function suchthat(gen, predicate) {
  gen = generator.force(gen);

  return {
    arbitrary: function (size) {
      for (var i = 0; ; i++) {
        // if 5 tries failed, increase size
        if (i > 5) {
          i = 0;
          size += 1;
        }

        var x = gen.arbitrary(size);
        if (predicate(x)) {
          return x;
        }
      }
    },

    shrink: function (x) {
      return gen.shrink(x).filter(predicate);
    },

    show: gen.show,
  };
}

/**
  #### nonshrink (gen : generator a) : generator a

  Non shrinkable version of generator `gen`.
*/
function nonshrink(gen) {
  gen = generator.force(gen);

  return {
    arbitrary: gen.arbitrary,
    shrink: shrink.noop,
    show: gen.show,
  };
}

module.exports = {
  suchthat: suchthat,
  nonshrink: nonshrink,
};
