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

		## API

		> _Testing shows the presence, not the absence of bugs._
		>
		> Edsger W. Dijkstra

		To show that propositions hold, we need to construct proofs.
		There are two extremes: proof by example (unit tests) and formal (machine-checked) proof.
		Property-based testing is something in between.
		We formulate propositions, invariants or other properties we believe to hold, but
		only test it to hold for numerous (random generated) values.

		Types and function signatures are written in [Coq](http://coq.inria.fr/)/[Haskell](http://www.haskell.org/haskellwiki/Haskell) influented style:
		C# -style `List<T> filter(List<T> v, Func<T, bool> predicate)` is represented by
		`filter (v : array T) (predicate : T -> bool) : array T` in our style.

		`jsverify` can operate with both synchronous and asynchronous-promise properties.
		Generally every property can be wrapped inside [functor](http://learnyouahaskell.com/functors-applicative-functors-and-monoids),
		for now in either identity or promise functor, for synchronous and promise properties respectively.

		Some type definitions to keep developers sane:

		- Functor f => property (size : nat) : f result
		- result := true | { counterexample: any }
		- Functor f => property_rec := f (result | property)
		- generator a := { arbitrary : a, shrink : a -> [a] }
	*/

	/**
		### jsc._ - miscellaneous utilities
	*/

	/**
		#### assert (exp : bool) (message : string) : void

		Throw an error with `message` if `exp` is falsy.
	*/
	function assert(exp, message) {
		if (!exp) {
			throw new Error(message);
		}
	}

	/**
		#### id (x : any) : any

		Identity function.
	*/
	function id(x) {
		return x;
	}

	/**
		#### isEqual (a b : value) : bool

		Equality test for `value` objects. See `value` generator.
	*/
	function isEqual(a, b) {
		// TODO: as values are integers for now this is ok.
		return a === b;
	}

	/**
		#### FMap (eq : a -> a -> bool) : FMap a

		Finite map, with any object a key.

		Short summary of member functions:

		- FMap.insert (key : a) (value : any) : void
		- FMap.get (key : a) : any
		- FMap.contains (key : a) : obool
	*/
	function FMap(eq) {
		this.eq = eq || isEqual;
		this.data = [];
	}

	FMap.prototype.contains = function FMap_contains(key) {
		for (var i = 0; i < this.data.length; i++) {
			if (this.eq(this.data[i][0], key)) {
				return true;
			}
		}

		return false;
	};

	FMap.prototype.insert = function FMap_insert(key, value) {
		for (var i = 0; i < this.data.length; i++) {
			if (this.eq(this.data[i][0], key)) {
				this.data[i] = [key, value];
				return;
			}
		}

		this.data.push([key, value]);
	};

	FMap.prototype.get = function FMap_get(key) {
		for (var i = 0; i < this.data.length; i++) {
			if (this.eq(this.data[i][0], key)) {
				return this.data[i][1];
			}
		}
	};

	/**
		#### isPromise p : bool

		Optimistic duck-type check for promises.
		Returns `true` if p is an object with `.then` function property.
	*/
	function isPromise(p) {
		return new Object(p) === p && typeof p.then === "function";
	}

	/**
		#### withPromise (Functor f) (p : f a) (f : a -> b) : f b

		This is functor map, `fmap`, with arguments flipped.
		Essentially `f(p)`. If `p` is promise, returns new promise.
		Using `withPromise` makes code look very much [CPS-style](http://en.wikipedia.org/wiki/Continuation-passing_style).
	*/
	function withPromise(p, f) {
		if (isPromise(p)) {
			return p.then(f);
		} else {
			return f(p);
		}
	}

	/**
		#### getRandomArbitrary (min max : number) : number

		Returns random number from `[min, max)` range.
	*/
	function getRandomArbitrary(min, max) {
		return Math.random() * (max - min) + min;
	}

	/**
		#### getRandomInt (min max : int) : int

		Returns random int from `[min, max]` range inclusively.

		```js
		getRandomInt(2, 3) // either 2 or 3
		```
	*/
	function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	}

	/**
		### Properties
	*/

	function shrinkTuple(generators, tuple) {
		assert(generators.length === tuple.length, "there should be as much generators as values in the tuple");

		var shrinked = new Array(tuple.length);

		for (var i = 0; i < tuple.length; i++) {
			/* jshint -W083 */
			shrinked[i] = generators[i].shrink(tuple[i]).map(function (x) {
				var c = tuple.slice(); // clone array
				c[i] = x;
				return c;
			});
			/* jshint +W083 */
		}

		return Array.prototype.concat.apply([], shrinked);
	}

	/**
		#### forall (gens : generator a ...) (prop : a -> property_rec) : property

		Property constructor
	*/
	function forall() {
		var gens = Array.prototype.slice.call(arguments, 0, -1);
		var property = arguments[arguments.length - 1];

		assert(typeof property === "function", "property should be a function");

		function test(size, x) {
			assert(x !== undefined, "generator result should be always not undefined -- temporary self check");

			var r = property.apply(undefined, x);
			return withPromise(r, function(r) {
				if (r === true) { return true; }
				if (typeof r === "function") {
					var r_rec = r(size);
					return withPromise(r_rec, function (r_rec) {
						if (r_rec === true) {
							return true;
						} else {
							var shrinked = shrinkTuple(gens, x);

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
				var shrinked = shrinkTuple(gens, x);

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
			var x = gens.map(function (gen) { return gen.arbitrary(size); });
			var r =  test(size, x);
			return r;
		};
	}

	/**
		#### check (prop : property) (opts : checkoptions) : promise result + result

		Run random checks for given `prop`. If `prop` is promise based, result is also wrapped in promise.

		Options:
		- `opts.tests` - test count to run, default 100
		- `opts.size`  - maximum size of generated values, default 5
		- `opts.quiet` - do not `console.log`
	*/
	function check(property, opts) {
		opts = opts || {};
		opts.size = opts.size || 5;
		opts.tests = opts.tests || 100;
		opts.quiet = opts.quiet || false;

		assert(typeof property === "function", "property should be a function");

		function loop(i) {
			if (i > opts.tests) {
				return true;
			}

			var size = i % (opts.size + 1);

			var r = property(size);
			return withPromise(r, function (r) {
				if (r === true) {
					return loop(i + 1);
				} else {
					/* global console */
					if (!opts.quiet) {
						console.error("Failed after " + i + " tests");
						console.error("Propery doesn't hold, counterexample with", r.counterexample);
					}
					return r;
				}
			});
		}

		return withPromise(loop(1), function (r) {
			if (r === true) {
				if (!opts.quiet) { console.info("OK, passed " + opts.tests + " tests"); }
			}
			return r;
		});
	}

	/**
		### Primitive generators
	*/

	/**
		#### integer (maxsize : nat) : generator integer

		Integers, ℤ
	*/
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
					// TODO: redo
					return [0, -i+1, i-1];
				}
			},
		};
	}

	/**
		#### nat (maxsize : nat) : generator nat

		Natural numbers, ℕ (0, 1, 2...)
	*/
	function nat(maxsize) {
		maxsize = maxsize || 1000;

		return {
			arbitrary: function (size) {
				size = Math.min(maxsize, size);

				return getRandomInt(0, size);
			},
			shrink: function (i) {
				if (i === 0) {
					return [];
				} else {
					// TODO: redo
					return [0, Math.floor(i/2)];
				}
			},
		};
	}

	/**
		#### number (maxsize : number) : generator number

		JavaScript numbers, "doubles", ℝ. `NaN` and `Infinity` are not included.
	*/
	function number(maxsize) {
		maxsize = maxsize || 1000;

		return {
			arbitrary: function (size) {
				size = Math.min(maxsize, size);

				return getRandomArbitrary(-size, size);
			},
			shrink: function () { return []; },
		};
	}

	/**
		#### bool () : generator bool

		Booleans, `true` or `false`.
	*/
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

	/**
		#### oneof (args : array any) : generator any

		Random element of `args` array.
	*/
	function oneof(args) {
		assert(args.length !== 0, "oneof: at least one parameter expected");

		return {
			arbitrary: function (size) {
				var i = getRandomInt(0, args.length-1);
				return args[i];
			},

			// TODO: make shrink
			shrink: function () { return []; },
		};
	}

	/**
		#### array (gen : generator a) : generator (array a)
	*/
	function array(generator) {
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

	function nonshrinkarray(generator) {
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

	/**
		#### value : generator value

		JavaScript value: boolean, number, string, array of values or object with `value` values.

		**TODO**: currently returns only integers.
	*/
	function value() {
		function arbitraryValue(size) {
			return getRandomArbitrary(-size, size);
		}

		return {
			arbitrary: arbitraryValue,
			shrink: function () { return []; }
		};
	}

	/**
		#### fun (gen : generator a) : generator (b -> a)

		Unary functions.
	*/
	function fun(gen) {
		gen = gen || value();

		return {
			arbitrary: function (size) {
				var m = new FMap();

				return function (arg) {
					if (!m.contains(arg)) {
						var value = gen.arbitrary(size);
						m.insert(arg, value);
					}

					return m.get(arg);
				};
			},

			shrink: function () {
				return [];
			},
		};
	}

	/**
		### Generator combinators
	*/

	/**
		#### pair (a : generator A) (b : generator B) : generator (A * B)

		If not specified `a` and `b` are equal to `integer()`.
	*/
	function pair(a, b) {
		a = a || integer();
		b = b || integer();

		return {
			arbitrary: function (size) {
				return [a.arbitrary(size), b.arbitrary(size)];
			},

			shrink: function (p) {
				return shrinkTuple([a, b], p);
			},
		};
	}

	/**
		#### suchthat (gen : generator a) (p : a -> bool) : generator {a | p a == true}

		Generator of values that satisfy `p` predicate. It's adviced that `p`'s accept rate is high.
	*/
	function suchthat(generator, predicate) {
		return {
			arbitrary: function (size) {
				for (var i = 0; ; i++) {
					// if 5 tries failed, increase size
					if (i > 5) {
						i = 0;
						size += 1;
					}

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

	// Export
	var jsc = {
		forall: forall,
		check: check,

		// generators
		nat: nat,
		integer: integer,
		number : number,
		bool: bool,
		pair: pair,
		array: array,
		value: value,
		nonshrinkarray: nonshrinkarray,
		fun: fun,
		oneof: oneof,
		suchthat: suchthat,

		// internal utility lib
		_: {
			assert: assert,
			id: id,
			isEqual: isEqual,
			FMap: FMap,
			isPromise: isPromise,
			withPromise: withPromise,
			getRandomInt: getRandomInt,
			getRandomArbitrary: getRandomArbitrary,
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

	- 0.0.2 Documented preview
	- 0.0.1 Initial preview

	## License

	Copyright (c) 2013 Oleg Grenrus. Licensed under the BSD3 license.

	## Related work

	### JavaScript

	- [JSCheck](http://www.jscheck.org/)
	- [claire](https://npmjs.org/package/claire)
	- [gent](https://npmjs.org/package/gent)
	- [fatcheck](https://npmjs.org/package/fatcheck)
	- [quickcheck](https://npmjs.org/package/quickcheck)
	- [qc.js](https://bitbucket.org/darrint/qc.js/)

	### Others

	- [Wikipedia - QuickCheck](http://en.wikipedia.org/wiki/QuickCheck)
	- [Haskell - QuickCheck](http://hackage.haskell.org/package/QuickCheck) [Introduction](http://www.haskell.org/haskellwiki/Introduction_to_QuickCheck1)
	- [Erlang - QuviQ](http://www.quviq.com/index.html)
	- [Erlang - triq](https://github.com/krestenkrab/triq)
	- [Scala - ScalaCheck](https://github.com/rickynils/scalacheck)
*/
