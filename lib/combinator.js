/* jshint node:true */
"use strict";

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

module.exports = {
  suchthat: suchthat,
};