"use strict";

var arbitrary = require("./arbitrary.js");
var bless = require("./bless.js");
var generator = require("./generator.js");
var primitive = require("./primitive.js");
var record = require("./record.js");
var recordWithEnv = require("./recordWithEnv.js");
var shrink = require("./shrink.js");
var small = require("./small.js");
var string = require("./string.js");

var api = {
  arbitrary: {
    small: small.arbitrary,
    bless: bless,
    record: recordWithEnv,
    nonshrink: arbitrary.nonshrink,
    pair: arbitrary.pair,
    either: arbitrary.either,
    unit: arbitrary.unit,
    dict: arbitrary.dict,
    json: arbitrary.json,
    nearray: arbitrary.nearray,
    array: arbitrary.array,
    tuple: arbitrary.tuple,
    sum: arbitrary.sum,
    oneof: arbitrary.oneof,
  },
  generator: {
    small: small.generator,
    record: record.generator,
  },
  shrink: {
    record: record.shrink,
  },
};

// Re-export stuff from internal modules
var k;
for (k in primitive) {
  api.arbitrary[k] = primitive[k];
}
for (k in string) {
  api.arbitrary[k] = string[k];
}
for (k in shrink) {
  api.shrink[k] = shrink[k];
}
for (k in generator) {
  api.generator[k] = generator[k];
}
module.exports = api;
