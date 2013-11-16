/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../lib/jsverify.js");
var _ = require("underscore");
var assert = require("assert");

describe("utility functions: _", function () {
	describe("isEqual", function () {
		it("is true for all values", function () {
			jsc.assert(jsc.forall(jsc.value(), function (x) {
				return jsc._.isEqual(x, JSON.parse(JSON.stringify(x)));
			}));
		});

		it("returns same as _.isEqual", function () {
			function predicate(x, y) {
				return _.isEqual(x, y) === jsc._.isEqual(x, y);
			}

			jsc.assert(jsc.forall(jsc.value(), jsc.value(), predicate));

			// also special cases
			assert(predicate({ a: 1, b: 2 }, { a: 1, b: 3 }));
			assert(predicate({ a: 2, b: 2 }, { a: 1, b: 3 }));
			assert(predicate({ a: 1}, { b: 1 }));
		});
	});

	describe("FMap", function () {
		it("insert into same key overwrites previous", function () {
			var m = new jsc._.FMap();
			m.insert([0], 1);
			m.insert([0], 2);
			assert.strictEqual(m.get([0]), 2);
		});
	});
});