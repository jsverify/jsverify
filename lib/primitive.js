"use strict";

var assert = require("assert");
var generator = require("./generator.js");
var random = require("./random.js");
var show = require("./show.js");
var shrink = require("./shrink.js");

/**
  ### Primitive arbitraries
*/

/**
  - `integer: arbitrary integer`
  - `integer(maxsize: nat): arbitrary integer`

      Integers, ℤ
*/
function integer(maxsize) {
  return {
    generator: generator.bless(function (size) {
      size = maxsize || size;
      return random(-size, size);
    }),
    shrink: shrink.bless(function (i) {
      i = Math.abs(i);
      if (i === 0) {
        return [];
      } else {
        // TODO: redo
        return [0, -i + 1, i - 1];
      }
    }),

    show: show.def,
  };
}

/**
  - `nat: arbitrary nat`
  - `nat(maxsize: nat): arbitrary nat`

      Natural numbers, ℕ (0, 1, 2...)
*/
function nat(maxsize) {
  return {
    generator: generator.bless(function (size) {
      size = maxsize || size;
      return random(0, size);
    }),
    shrink: shrink.bless(function (i) {
      var arr = [];
      for (var j = 0; j < i; j++) {
        arr.push(j);
      }
      return arr;
    }),
    show: show.def,
  };
}

/**
  - `number: arbitrary number`
  - `number(maxsize: number): arbitrary number`

      JavaScript numbers, "doubles", ℝ. `NaN` and `Infinity` are not included.
*/
function number(maxsize) {
  return {
    generator: generator.bless(function (size) {
      size = maxsize || size;
      return random.number(-size, size);
    }),
    shrink: shrink.noop,
    show: show.def,
  };
}

/**
  - `uint8: arbitrary nat`
  - `uint16: arbitrary nat`
  - `uint32: arbitrary nat`
*/
var uint8 = nat(0xff);
var uint16 = nat(0xffff);
var uint32 = nat(0xffffffff);

/**
  - `int8: arbitrary integer`
  - `int16: arbitrary integer`
  - `int32: arbitrary integer`
*/
var int8 = integer(0x80);
var int16 = integer(0x8000);
var int32 = integer(0x80000000);

/**
  - `bool: generator bool`

      Booleans, `true` or `false`.
*/
var bool = {
  generator: generator.bless(function (/* size */) {
    var i = random(0, 1);
    return i === 0 ? false : true;
  }),

  shrink: shrink.bless(function (b) {
    return b === true ? [false] : [];
  }),
  show: show.def,
};

/**
  - `elements(args: array a): generator a`

      Random element of `args` array.
*/
function elements(args) {
  assert(args.length !== 0, "elements: at least one parameter expected");

  return {
    generator: generator.bless(function (/* size */) {
      var i = random(0, args.length - 1);
      return args[i];
    }),

    // TODO: make shrink
    shrink: shrink.noop,
    show: show.def,
  };
}

/**
  - `char: generator char`

      Single character
*/
var char = {
  generator: generator.bless(function (/* size */) {
    return String.fromCharCode(random(0, 0x1ff));
  }),
  shrink: shrink.noop,
  show: show.def,
};

/**
  - `asciichar: generator char`

      Single ascii character (0x20-0x7e inclusive, no DEL)
*/
var asciichar = {
  generator: generator.bless(function (/* size */) {
    return String.fromCharCode(random(0x20, 0x7f));
  }),
  shrink: shrink.noop,
  show: show.def,
};

/**
  - `string: generator string`
*/
function string() {
  return {
    generator: generator.string,
    shrink: function (str) {
      return str === "" ? [] : [""]; // TODO
    },
    show: show.def,
  };
}

/**
  - `notEmptyString: arbitrary string`

      Generates strings which are not empty.
*/
var nestring = {
  generator: generator.nestring,
  shrink: shrink.noop, // todo implement me
  show: show.def,
};

/**
  - `asciistring: generator string`
*/
var asciistring = {
  generator: generator.bless(function (size) {
    return generator.array(asciichar.generator, size).join("");
  }),
  shrink: shrink.bless(function (str) {
    return str === "" ? [] : [""]; // TODO
  }),
  show: show.def,
};

/**
  - `json: generator json`

       JavaScript Objects: boolean, number, string, array of `json` values or object with `json` values.

  - `value: generator json`
*/
var json = {
  generator: generator.json,
  shrink: shrink.noop,
  show: function (v) {
    return JSON.stringify(v);
  },
};

/**
  - `falsy: arbitrary *`

      Generates falsy values: `false`, `null`, `undefined`, `""`, `0`, and `NaN`.
*/
var falsy = elements([false, null, undefined, "", 0, NaN]);
falsy.show = function (v) {
  if (v !== v) {
    return "falsy: NaN";
  } else if (v === "") {
    return "falsy: empty string";
  } else if (v === undefined) {
    return "falsy: undefined";
  } else {
    return "falsy: " + v;
  }
};

/**
  - `constant(x: a): arbitrary a`

      Returns an unshrinkable arbitrary that yields the given object.
*/
function constant(x) {
  return {
    generator: generator.constant(x),
    shrink: shrink.noop,
    show: show.def
  };
}

module.exports = {
  integer: integer,
  nat: nat,
  int8: int8,
  int16: int16,
  int32: int32,
  uint8: uint8,
  uint16: uint16,
  uint32: uint32,
  number: number,
  json: json,
  char: char,
  string: string,
  asciichar: asciichar,
  asciistring: asciistring,
  elements: elements,
  bool: bool,
  falsy: falsy,
  constant: constant,
  nestring: nestring,
};
