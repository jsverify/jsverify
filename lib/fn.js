"use strict";

var shrink = require("./shrink.js");
var primitive = require("./primitive.js");
var FMap = require("./finitemap.js");
var generator = require("./generator.js");

/**
  #### fn (gen : generator a) : generator (b -> a)

  Unary functions.

  _fun_ alias for _fn_
*/

function fn(gen) {
  gen = generator.force(gen || primitive.value);

  return {
    arbitrary: function (size) {
      var m = new FMap();

      var f = function (arg) {
        if (!m.contains(arg)) {
          var value = gen.arbitrary(size);
          m.insert(arg, value);
        }

        return m.get(arg);
      };

      f.internalMap = m;
      return f;
    },

    shrink: shrink.noop,
    show: function (f) {
      return "[" + f.internalMap.data.map(function (item) {
        return "" + item[0] + ": " + gen.show(item[1]);
      }).join(", ") + "]";
    }
  };
}

module.exports = {
  fn: fn,
  fun: fn,
};
