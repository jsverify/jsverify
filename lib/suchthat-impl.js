"use strict";

// suchthat implementation, for use internally
function suchthatImpl(arb, predicate) {
  return {
    generator: function (size) {
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
    },

    shrink: function (x) {
      return arb.shrink(x).filter(predicate);
    },

    show: arb.show,
  };
}

module.exports = {
  suchthatImpl: suchthatImpl
};
