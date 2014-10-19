"use strict";

/**
  ### DSL for input parameters

  There is a small DSL to help with `forall`. For example the two definitions below are equivalent:
  ```js
  var bool_fn_applied_thrice = jsc.forall("bool -> bool", "bool", check);
  var bool_fn_applied_thrice = jsc.forall(jsc.fn(jsc.bool()), jsc.bool(), check);
  ```

  The DSL is based on a subset of language recognized by [typify-parser](https://github.com/phadej/typify-parser):
  - *identifiers* are fetched from the predefined environment.
  - *applications* are applied as one could expect: `"array bool"` is evaluated to `jsc.array(jsc.bool)`.
  - *functions* are supported: `"bool -> bool"` is evaluated to `jsc.fn(jsc.bool())`.
  - *square brackets* are treated as a shorthand for the array type: `"[nat]"` is evaulated to `jsc.array(jsc.nat)`.
*/

var fn = require("./fn.js");
var composite = require("./composite.js");
var typifyParser = require("typify-parser");

// Forward declarations
var compileType;
var compileTypeArray;

function compileIdent(env, type) {
  var g = env[type.value];
  if (!g) {
    throw new Error("Unknown generator: " + type.value);
  }
  return g;
}

function compileApplication(env, type) {
  var callee = compileType(env, type.callee);
  var args = compileTypeArray(env, type.args);

  return callee.apply(undefined, args);
}

function compileFunction(env, type) {
  // we don't care about argument type
  var result = compileType(env, type.result);
  return fn.fn(result);
}

function compileBrackets(env, type) {
  var arg = compileType(env, type.arg);
  return composite.array(arg);
}

function compileDisjunction(env, type) {
  var args = compileTypeArray(env, type.args);
  return composite.oneof(args);
}

compileType = function compileType(env, type) {
  switch (type.type) {
    case "ident": return compileIdent(env, type);
    case "application": return compileApplication(env, type);
    case "function": return compileFunction(env, type);
    case "brackets": return compileBrackets(env, type);
    case "disjunction": return compileDisjunction(env, type);
    default: throw new Error("Unsupported typify ast type: " + type.type);
  }
};

compileTypeArray = function compileTypeArray(env, types) {
  return types.map(function (type) {
    return compileType(env, type);
  });
};

function parseTypify(env, str) {
  var type = typifyParser(str);
  return compileType(env, type);
}

module.exports = {
  parseTypify: parseTypify,
};
