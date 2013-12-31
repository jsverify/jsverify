/* jshint node:true */
"use strict";

var shrink = require("./shrink.js");

/**
  ### Generator combinators
*/

/**
  #### suchthat (gen : generator a) (p : a -> bool) : generator {a | p a == true}

  Generator of values that satisfy `p` predicate. It's adviced that `p`'s accept rate is high.
*/
function suchthat(generator, predicate) {
  return {
    arbitrary: function (size) {
      for (var i = 0; ; i++) {
        // if 5 tries failed, increase size
        if (i > 5) {
          i = 0;
          size += 1;
        }

        var x = generator.arbitrary(size);
        if (predicate(x)) {
          return x;
        }
      }
    },

    shrink: function (x) {
      return generator.shrink(x).filter(predicate);
    },

    show: generator.show,
  };
}

/**
  #### nonshrink (gen : generator a) : generator a

  Non shrinkable version of generator `gen`.
*/
function nonshrink(generator) {
  return {
    arbitrary: generator.arbitrary,
    shrink: shrink.noop,
    show: generator.show,
  };
}

module.exports = {
  suchthat: suchthat,
  nonshrink: nonshrink,
};
