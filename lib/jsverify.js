/**
	# JSVerify [![Build Status](https://secure.travis-ci.org/phadej/jsverify.png?branch=master)](http://travis-ci.org/phadej/jsverify)

	Property based checking.

	## Getting Started
	Install the module with: `npm install jsverify`

	## Synopsis

	```js
	var jsc = require("jsverify");
	```

	Example output of `node example.js`:

	```
	Propery doesn't hold, counterexample with undefined
	inc failing: false
	inc fixed: true
	Propery doesn't hold, counterexample with [ 0 ]
	add failing: { counterexample: [ 0 ] }
	add fixed: true
	Propery doesn't hold, counterexample with [ 0, -1 ]
	add3 failing: { counterexample: [ 0, -1 ] }
	intersects([1, 2], [1, 3]) true
	intersects([1, 2], [3, 4]) false
	Propery doesn't hold, counterexample with [ [] ]
	intersects try 1: { counterexample: [ [] ] }
	Propery doesn't hold, counterexample with [ [] ]
	intersects try 2: { counterexample: [ [] ] }
	intersects try 3: true
	intersects try 4: true
	```
*/

(function () {
	"use strict";
	/**
		## Documentation

		### Use with [jasmine](http://pivotal.github.io/jasmine/) 1.3.x

		Check [jasmineHelpers.js](speclib/jasmineHelpers.js) file.

		### API

		TBD
	*/
	function assert(exp, message) {
		if (!exp) {
			throw new Error(message);
		}
	}

	function isPromise(p) {
		return new Object(p) === p && typeof p.then === "function";
	}

	function withPromise(p, f) {
		if (isPromise(p)) {
			return p.then(f);
		} else {
			return f(p);
		}
	}

	function forall(generator, property) {
		assert(typeof property === "function", "property should be a function");

		function test(size, x) {
			assert(x !== undefined, "generator result should be always not undefined -- temporary self check");

			var r = property(x);
			return withPromise(r, function(r) {
				if (r === true) { return true; }
				if (typeof r === "function") {
					var r_rec = r(size);
					return withPromise(r_rec, function (r_rec) {
						if (r_rec === true) {
							return true;
						} else {
							var shrinked = generator.shrink(x);

							var shrinkP = shrinked.reduce(function (res, y) {
								return withPromise(res, function (res) {
									if (res !== true) {
										return res;
									}

									return test(size, y);
								});
							}, true);

							return withPromise(shrinkP, function (shrinkP) {
								if (shrinkP === true) {
									return withPromise(r_rec, function (r_rec) {
										if (r_rec && r_rec.counterexample) {
											return { counterexample: [x].concat(r_rec.counterexample) };
										} else {
											return { counterexample: [x] };
										}
									});
								} else {
									return shrinkP;
								}
							});
						}
					});
				}

				// TODO: copypaste, cleanup
				var shrinked = generator.shrink(x);

				var shrinkP = shrinked.reduce(function (res, y) {
					return withPromise(res, function (res) {
						if (res !== true) {
							return res;
						}

						return test(size, y);
					});
				}, true);

				return withPromise(shrinkP, function (shrinkP) {
					if (shrinkP === true) {
						return { counterexample: [x] };
					} else {
						return shrinkP;
					}
				});
			});
		}

		return function (size) {
			var x = generator.arbitrary(size);
			var r =  test(size, x);
			return r;
		};
	}

	function check(property) {
		var size = 5;

		assert(typeof property === "function", "property should be a function");

		function loop(i) {
			if (i === 0) {
				return true;
			}

			var r = property(size);
			return withPromise(r, function (r) {
				if (r === true) {
					return loop(i-1);
				} else {
					/* global console */
					console.error("Propery doesn't hold, counterexample with", r.counterexample);
					return r;
				}
			});
		}

		return loop(100);
	}

	// Random helpers
	/*
	function getRandomArbitrary(min, max) {
		return Math.random() * (max - min) + min;
	}
	*/
	function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	}

	// Generators
	function integer(maxsize) {
		maxsize = maxsize || 1000;

		return {
			arbitrary: function (size) {
				size = Math.min(maxsize, size);

				return getRandomInt(-size, size);
			},
			shrink: function (i) {
				i = Math.abs(i);
				if (i === 0) {
					return [];
				} else {
					return [0, -i+1, i-1];
				}
			},
		};
	}

	function pair(a, b) {
		return {
			arbitrary: function (size) {
				return [a.arbitrary(size), b.arbitrary(size)];
			},

			shrink: function (p) {
				var x = p[0];
				var y = p[1];

				return [].concat(
					a.shrink(x).map(function (xp) { return [xp, y]; }),
					b.shrink(y).map(function (yp) { return [x, yp]; })
				);
			},
		};
	}

    function oneof(args) {
        assert(args.length !== 0, "oneof: at least one parameter expected");

        return {
            arbitrary: function (size) {
                var i = getRandomInt(0, args.length-1);
                return args[i];
            },

            shrink: function () { return []; },
        };
    }

    function suchthat(generator, predicate) {
        return {
            arbitrary: function (size) {
                while (true) {
                    var x = generator.arbitrary(size);
                    if (predicate(x)) {
                        return x;
                    }
                }
            },

            shrink: function (x) {
                return generator.shrink(x).filter(predicate);
            },
        };
    }

    function bool() {
        return {
            arbitrary: function (size) {
                var i = getRandomInt(0, 1);
                return i === 0 ? false : true;
            },

            shrink: function (b) {
                return b === true ? [false] : [];
            },
        };
    }

	function list(generator) {
		generator = generator || integer();

		return {
			arbitrary: function (size) {
				var arrsize = getRandomInt(0, size);
				var arr = new Array(arrsize);
				for (var i = 0; i < arrsize; i++) {
					arr[i] = generator.arbitrary(size);
				}
				return arr;
			},

			shrink: function(arr) {
				function shrink(arr) {
					if (arr.length === 0) {
						return [];
					} else {
						var x = arr[0];
						var xs = arr.slice(1);

						return [xs].concat(
							generator.shrink(x).map(function (xp) { return [xp].concat(xs); }),
							shrink(xs).map(function (xsp) { return [x].concat(xsp); })
						);
					}
				}

				return shrink(arr);
			}
		};
	}

	function nonshrinklist(generator) {
		generator = generator || integer();

		return {
			arbitrary: function (size) {
				var arrsize = getRandomInt(0, size);
				var arr = new Array(arrsize);
				for (var i = 0; i < arrsize; i++) {
					arr[i] = generator.arbitrary(size);
				}
				return arr;
			},

			shrink: function() {
				return [];
			}
		};
	}

	// Export
	var jsc = {
		forall: forall,
		check: check,

		// generators
		integer: integer,
        bool: bool,
		pair: pair,
		list: list,
		nonshrinklist: nonshrinklist,
        oneof: oneof,
        suchthat: suchthat,

		// internal utility lib
		_: {
			assert: assert,
			isPromise: isPromise,
			withPromise: withPromise,
		},
	};

	/* global window, module */
	if (typeof window !== "undefined") {
		window.jsc = jsc;
	} else if (typeof module !== "undefined" && module.exports !== "undefined") {
		module.exports = jsc;
	}
}());

/**
	## Contributing

	In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

	- You can use `grunt jasmine-build` to generate `_SpecRunner.html` to run tests in your browser of choice.
	- Use tabs for indentation

	### Preparing for release

	- run `grunt readme` to regenerate `README.md`

	## Release History

	- 0.0.0 Initial preview

	## License

	Copyright (c) 2013 Oleg Grenrus. Licensed under the BSD3 license.

	## Related work

	- [JSCheck](http://www.jscheck.org/)
	- [claire](https://npmjs.org/package/claire)
	- [gent](https://npmjs.org/package/gent)
	- [fatcheck](https://npmjs.org/package/fatcheck)
	- [quickcheck](https://npmjs.org/package/quickcheck)
*/
