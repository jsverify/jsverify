/* jshint node:true */
"use strict";

var shrink = require("./shrink.js");
var show = require("./show.js");
var primitive = require("./primitive.js");
var FMap = require("./finitemap.js");

/**
  #### fun (gen : generator a) : generator (b -> a)

  Unary functions.
*/

function fun(gen) {
  gen = gen || primitive.value();

  return {
    arbitrary: function (size) {
      var m = new FMap();

      return function (arg) {
        if (!m.contains(arg)) {
          var value = gen.arbitrary(size);
          m.insert(arg, value);
        }

        return m.get(arg);
      };
    },

    shrink: shrink.noop,
    show: show.def,
  };
}

module.exports = {
  fun: fun,
};
