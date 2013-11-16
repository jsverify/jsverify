/* jshint node:true */

var assert = require("assert");
var random = require("./random.js");
var arbitrary = require("./arbitrary.js");
var shrink = require("./shrink.js");
var show = require("./show.js");
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
        return [0, -i+1, i-1];
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
  #### bool () : generator bool

  Booleans, `true` or `false`.
*/
function bool() {
  return {
    arbitrary: function (size) {
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
  #### oneof (args : array any) : generator any

  Random element of `args` array.
*/
function oneof(args) {
  assert(args.length !== 0, "oneof: at least one parameter expected");

  return {
    arbitrary: function (size) {
      var i = random(0, args.length-1);
      return args[i];
    },

    // TODO: make shrink
    shrink: shrink.noop,
    show: show.def,
  };
}

/**
  #### string () : generator string

  Strings
*/
function string() {
  return {
    arbitrary: arbitrary.string,
    shrink: shrink.noop, // TODO:
    show: show.def,
  };
}

/**
  #### value : generator value

  JavaScript value: boolean, number, string, array of values or object with `value` values.
*/
function value() {
  function arbitraryValue(size) {
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
      case 4: return arbitrary.array(arbitraryValue, size);
      case 5: return arbitrary.object(arbitraryValue, size);
    }
  }

  return {
    arbitrary: arbitraryValue,
    shrink: shrink.noop,
    show: function (value) {
      return JSON.stringify(value);
    }
  };
}

module.exports = {
  integer: integer,
  nat: nat,
  number: number,
  value: value,
  string: string,
  oneof: oneof,
  bool: bool,
};