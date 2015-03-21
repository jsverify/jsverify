"use strict";

var arbitraryBless = require("./arbitraryBless.js");
var generator = require("./generator.js");
var primitive = require("./primitive.js");
var show = require("./show.js");
var dict = require("./dict.js");
var shrink = require("./shrink.js");
var string = require("./string.js");

var generateInteger = primitive.integer.generator;
var generateNumber = primitive.number.generator;
var generateBool = primitive.bool.generator;
var generateString = string.string.generator;

function generateMap(gen) {
  return dict.dict(arbitraryBless({ generator: gen, shrink: shrink.noop, show: show.def })).generator;
}

var generateJson = generator.recursive(
  generator.oneof([generateInteger, generateNumber, generateBool, generateString]),
  function (gen) {
    return generator.oneof([generator.array(gen), generateMap(gen)]);
  });

var json = arbitraryBless({
  generator: generateJson,
  shrink: shrink.noop,
  show: show.def,
});

module.exports = {
  json: json,
};
