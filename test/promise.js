/* jshint node:true */
/* global describe, it */
"use strict";

var jsc = require("../lib/jsverify.js");
var q = require("q");

describe("promises", function (done) {
	it("check", function () {
		var p = jsc.check(jsc.forall(jsc.nat(), function (n) {
			return q.delay(10).then(function () {
				return n === n;
			});
		}));

		p.then(function (r) {
			if (r === true) {
				done();
			} else {
				done(r);
			}
		});
	});

	it("recursive", function (done) {
		var p = jsc.check(jsc.forall(jsc.nat(), function (n) {
			return jsc.forall(jsc.nat(), function (m) {
				return q.delay(10).then(function () {
					return n === m;
				});
			});
		}));

		p.then(function (r) {
			if (r === true) {
				done("error");
			} else {
				done();
			}
		});
	});

	it("fail", function (done) {
		var p = jsc.check(jsc.forall(jsc.nat(), function (n) {
			return q.delay(10).then(function () {
				throw new Error("fail always");
			});
		}));

		p.then(function (r) {
			if (r === true) {
				done("error");
			} else {
				done();
			}
		});
	});
});
