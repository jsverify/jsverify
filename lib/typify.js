"use strict";

var fn = require("./fn.js");
var composite = require("./composite.js");
var typifyParser = require("typify-parser");

// Forward declarations
var compileType, compileTypeArray;

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

function compileType(env, type) {
  switch (type.type) {
    case "ident": return compileIdent(env, type);
    case "application": return compileApplication(env, type);
    case "function": return compileFunction(env, type);
    case "brackets": return compileBrackets(env, type);
    default: throw new Error("Unsupported typify ast type: " + type.type);
  }
}

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
