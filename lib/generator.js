"use strict";

var random = require("./random.js");

/**
    ### Generator functions
*/

/**
   - `generator.array(gen: Gen a, size: nat): gen (array a)`
*/
function generateArray(gen, size) {
  var arrsize = random(0, size);
  var arr = new Array(arrsize);
  for (var i = 0; i < arrsize; i++) {
    arr[i] = gen(size);
  }
  return arr;
}

/**
  - `generator.string(size: nat): gen string`
*/
function generateString(size) {
  return generateArray(function () {
    return String.fromCharCode(random(0, 0xff));
  }, size).join("");
}

/**
  - `generator.map(gen: gen a, size: nat): gen (map a)`
*/
function generateMap(gen, size) {
  var objsize = random(0, size);
  var obj = {};
  for (var i = 0; i < objsize; i++) {
    obj[generateString(size)] = gen(size);
  }
  return obj;
}

/**
  - `generator.json: gen json`
*/
function generateJson(size) {
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
    case 3: return generateString(size);
    case 4: return generateArray(generateJson, size);
    case 5: return generateMap(generateJson, size);
  }
}

/**
  - `generator.oneof(gen: list (gen a), size: nat): gen a`
*/
function generateOneof(generators) {
  return function (size) {
    var idx = random(0, generators.length - 1);
    var arb = generators[idx];
    return arb(size);
  };
}

module.exports = {
  array: generateArray,
  string: generateString,
  map: generateMap,
  json: generateJson,
  oneof: generateOneof,
};
