"use strict";

var show = require("./show.js");

/**
  ### Arbitrary data
*/

// Blessing: i.e adding prototype
/* eslint-disable no-use-before-define */
function arbitraryProtoSMap(f, g, newShow) {
  /* jshint validthis:true */
  var arb = this;
  return arbitraryBless({
    generator: arb.generator.map(f),
    shrink: arb.shrink.smap(f, g),
    show: newShow || show.def
  });
}
/* eslint-enable no-use-before-define */

/**
  - `.smap(f: a -> b, g: b -> a, newShow: (b -> string)?): arbitrary b`

      Transform `arbitrary a` into `arbitrary b`. For example:

      `g` should be a [right inverse](http://en.wikipedia.org/wiki/Surjective_function#Surjections_as_right_invertible_functions) of `f`.

      ```js
      positiveIntegersArb = nat.smap(
        function (x) { return x + 1; },
        function (x) { return x - 1; });
      ```
*/
function arbitraryBless(arb) {
  arb.smap = arbitraryProtoSMap;
  return arb;
}

module.exports = arbitraryBless;
