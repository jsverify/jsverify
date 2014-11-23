"use strict";

var assert = require("assert");
var generator = require("./generator.js");
var random = require("./random.js");
var show = require("./show.js");
var shrink = require("./shrink.js");
var utils = require("./utils.js");

/**
  ### Primitive arbitraries
*/

function extendWithDefault(arb) {
  var def = arb();
  arb.generator = def.generator;
  arb.shrink = def.shrink;
  arb.show = def.show;
}

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
        var arr = [0];
        var j = utils.div2(i);
        var k = Math.max(j, 1);
        while (j < i) {
          arr.push(j);
          arr.push(-j);
          k = Math.max(utils.div2(k), 1);
          j += k;
        }
        return arr;
      }
    }),

    show: show.def,
  };
}

extendWithDefault(integer);

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
      var j = utils.div2(i);
      var k = Math.max(j, 1);
      while (j < i) {
        arr.push(j);
        k = Math.max(utils.div2(k), 1);
        j += k;
      }
      return arr;
    }),
    show: show.def,
  };
}

extendWithDefault(nat);

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
    shrink: shrink.bless(function (x) {
      if (Math.abs(x) > 1e-6) {
        return [0, x / 2, -x / 2];
      } else {
        return [];
      }
    }),
    show: show.def,
  };
}

extendWithDefault(number);

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
  - `datetime: generator datetime`

      Random datetime
*/
var datetimeConst = 1416499879495; // arbitrary datetime

function datetime(from, to) {
  if (arguments.length === 2) {
    from = from.getTime();
    to = to.getTime();

    return {
      generator: generator.bless(function () {
        return new Date(random.number(from, to));
      }),
      // TODO: implement datetime shrink
      shrink: shrink.noop,
      show: show.def,
    };
  } else {
    return {
      generator: generator.bless(function (size) {
        // TODO: if size === 0 return datetimeConst or distantPast or distantFuture
        return new Date(random.number(-size, size) * 768000000 + datetimeConst);
      }),

      // TODO: implement datetime shrink
      shrink: shrink.noop,
      show: show.def,
    };
  }
}

extendWithDefault(datetime);

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

    shrink: function (x) {
      var idx = args.indexOf(x);
      if (idx <= 0) {
        return [];
      } else {
        return args.slice(0, idx);
      }
    },
    show: show.def,
  };
}

function natToChar(n) {
  return String.fromCharCode(n);
}

/**
  - `char: generator char`

      Single character
*/
var natChar = nat(0x1ff);

var char = {
  generator: natChar.generator.map(natToChar),
  shrink: shrink.noop,
  show: show.def,
};

function natToAsciiChar(n) {
  return String.fromCharCode(n + 0x20);
}

/**
  - `asciichar: generator char`

      Single ascii character (0x20-0x7e inclusive, no DEL)
*/
var natAsciiChar = nat(0x77 - 0x20);

var asciichar = {
  generator: natAsciiChar.generator.map(natToAsciiChar),
  shrink: shrink.noop,
  show: show.def,
};

function arrayToString(arr) {
  return arr.join("");
}

function stringToArray(str) {
  return str.split("");
}

/**
  - `string: generator string`
*/
function string() {
  return {
    generator: generator.string,
    shrink: shrink.array(char.shrink).isomap(arrayToString, stringToArray),
    show: show.def,
  };
}

extendWithDefault(string);

/**
  - `notEmptyString: arbitrary string`

      Generates strings which are not empty.
*/
var nestring = {
  generator: generator.nestring,
  shrink: shrink.nearray(asciichar.shrink).isomap(arrayToString, stringToArray),
  show: show.def,
};

/**
  - `asciistring: generator string`
*/
var asciistring = {
  generator: generator.bless(function (size) {
    return generator.array(asciichar.generator, size).join("");
  }),
  shrink: shrink.array(asciichar.shrink).isomap(arrayToString, stringToArray),
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
  datetime: datetime,
};
