"use strict";

var typifyParser = require("typify-parser");

function compileIdent(env, type) {
  var g = env[type.value];
  if (!g) {
    throw new Error("Unknown generator: " + g);
  }
  return g;
}

function compileType(env, type) {
  switch (type.type) {
    case "ident": return compileIdent(env, type);
    default: throw new Error("Unsupported typify ast type: " + type.type);
  }
}

function parseTypify(env, str) {
  var type = typifyParser(str);
  return compileType(env, type);
}

module.exports = {
  parseTypify: parseTypify,
};
