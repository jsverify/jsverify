"use strict";

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

function compileType(env, type) {
  switch (type.type) {
    case "ident": return compileIdent(env, type);
    case "application": return compileApplication(env, type);
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
