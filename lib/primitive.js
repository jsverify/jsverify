"use strict";

var assert = require("assert");
var random = require("./random.js");
var arbitrary = require("./arbitrary.js");
var shrink = require("./shrink.js");
var show = require("./show.js");

/**
  ### Primitive generators
*/

/**
  #### integer (maxsize : nat) : generator integer

  Integers, ℤ
*/
function integer(maxsize) {
  maxsize = maxsize || 1000;

  return {
    arbitrary: function (size) {
      size = Math.min(maxsize, size);

      return random(-size, size);
    },
    shrink: function (i) {
      i = Math.abs(i);
      if (i === 0) {
        return [];
      } else {
        // TODO: redo
        return [0, -i + 1, i - 1];
      }
    },

    show: show.def,
  };
}

/**
  #### nat (maxsize : nat) : generator nat

  Natural numbers, ℕ (0, 1, 2...)
*/
function nat(maxsize) {
  maxsize = maxsize || 1000;

  return {
    arbitrary: function (size) {
      size = Math.min(maxsize, size);
      return random(0, size);
    },
    shrink: function (i) {
      var arr = [];
      for (var j = 0; j < i; j++) {
        arr.push(j);
      }
      return arr;
    },
    show: show.def,
  };
}

/**
  #### number (maxsize : number) : generator number

  JavaScript numbers, "doubles", ℝ. `NaN` and `Infinity` are not included.
*/
function number(maxsize) {
  maxsize = maxsize || 1000;

  return {
    arbitrary: function (size) {
      size = Math.min(maxsize, size);

      return random.number(-size, size);
    },
    shrink: shrink.noop,
    show: show.def,
  };
}

/**
  #### uint8, uint16, uint32 : generator nat
*/
var uint8 = nat(0x100);
var uint16 = nat(0x10000);
var uint32 = nat(0x100000000);

/**
  #### int8, int16, int32 : generator integer
*/
var int8 = integer(0x80);
var int16 = integer(0x8000);
var int32 = integer(0x80000000);

/**
  #### bool () : generator bool

  Booleans, `true` or `false`.
*/
function bool() {
  return {
    arbitrary: function (/* size */) {
      var i = random(0, 1);
      return i === 0 ? false : true;
    },

    shrink: function (b) {
      return b === true ? [false] : [];
    },
    show: show.def,
  };
}

/**
  #### elements (args : array any) : generator any

  `oneof` is deprecated alias for `elements.
  In next major version `oneof` will take array of generators as in [Haskell's QuickCheck](https://hackage.haskell.org/package/QuickCheck-2.7.6/docs/Test-QuickCheck-Gen.html#v:oneof).

  Random element of `args` array.
*/
function elements(args) {
  assert(args.length !== 0, "elements: at least one parameter expected");

  return {
    arbitrary: function (/* size */) {
      var i = random(0, args.length - 1);
      return args[i];
    },

    // TODO: make shrink
    shrink: shrink.noop,
    show: show.def,
  };
}

/**
  #### char : generator char

  Single character
*/
var char = {
  arbitrary: function (/* size */) {
    return String.fromCharCode(random(0, 0x1ff));
  },
  shrink: shrink.noop,
  show: show.def,
};

/**
  #### asciichar : generator char

  Single ascii character (0x20-0x7e inclusive, no DEL)
*/
var asciichar = {
  arbitrary: function (/* size */) {
    return String.fromCharCode(random(0x20, 0x7f));
  },
  shrink: shrink.noop,
  show: show.def,
};

/**
  #### string () : generator string

  Strings
*/
function string() {
  return {
    arbitrary: arbitrary.string,
    shrink: function (str) {
      return str === "" ? [] : [""]; // TODO
    },
    show: show.def,
  };
}

/**
  #### asciistring : generator string
*/
var asciistring = {
  arbitrary: function (size) {
    return arbitrary.array(asciichar.arbitrary, size).join("");
  },
  shrink: function (str) {
    return str === "" ? [] : [""]; // TODO
  },
  show: show.def,
};

/**
  #### json : generator json

  JavaScript Objects: boolean, number, string, array of `json` values or object with `json` values.
*/
function arbitraryJson(size) {
  var type = random(0, 5);
  if (size === 0) {
    switch (type) {
      case 0: return 0;
      case 1: return random.number(0, 1);
      case 2: return random(0, 1) === 0;
      case 3: return "";
      case 4: return [];
      case 5: return {};
    }
  }

  size = size - 1;

  switch (type) {
    case 0: return random(-size, size);
    case 1: return random.number(-size, size);
    case 2: return random(0, 1) === 0;
    case 3: return arbitrary.string(size);
    case 4: return arbitrary.array(arbitraryJson, size);
    case 5: return arbitrary.object(arbitraryJson, size);
  }
}

var json = {
  arbitrary: arbitraryJson,
  shrink: shrink.noop,
  show: function (v) {
    return JSON.stringify(v);
  },
};

// Backward compatibility
function value() {
  return json;
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
  value: value,
  char: char,
  string: string,
  asciichar: asciichar,
  asciistring: asciistring,
  elements: elements,
  bool: bool,
};
