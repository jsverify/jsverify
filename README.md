# JSVerify

<img src="https://raw.githubusercontent.com/phadej/jsverify/master/jsverify-300.png" align="right" height="100" />

> Property based checking.

[![Build Status](https://secure.travis-ci.org/phadej/jsverify.svg?branch=master)](http://travis-ci.org/phadej/jsverify)
[![NPM version](https://badge.fury.io/js/jsverify.svg)](http://badge.fury.io/js/jsverify)
[![Dependency Status](https://david-dm.org/phadej/jsverify.svg)](https://david-dm.org/phadej/jsverify)
[![devDependency Status](https://david-dm.org/phadej/jsverify/dev-status.svg)](https://david-dm.org/phadej/jsverify#info=devDependencies)
[![Code Climate](https://img.shields.io/codeclimate/github/phadej/jsverify.svg)](https://codeclimate.com/github/phadej/jsverify)

## Getting Started

Install the module with: `npm install jsverify`

## Synopsis

```js
var jsc = require("jsverify");

// forall (f : bool -> bool) (b : bool), f (f (f b)) = f(b).
var boolFnAppliedThrice =
  jsc.forall("bool -> bool", "bool", function (f, b) {
    return f(f(f(b))) === f(b);
  });

jsc.assert(boolFnAppliedThrice);
// OK, passed 100 tests
```


## Documentation

### Usage with [mocha](http://visionmedia.github.io/mocha/)

Using jsverify with mocha is easy, just define the properties and use `jsverify.assert`.

You can also provide `--jsverifyRngState state` command line argument, to run tests with particular random generator state.

```
$ mocha examples/nat.js

1) natural numbers are less than 90:
 Error: Failed after 49 tests and 1 shrinks. rngState: 074e9b5f037a8c21d6; Counterexample: 90;

$ mocha examples/nat.js --grep 'are less than' --jsverifyRngState 074e9b5f037a8c21d6

1) natural numbers are less than 90:
   Error: Failed after 1 tests and 1 shrinks. rngState: 074e9b5f037a8c21d6; Counterexample: 90;
```

Errorneous case is found with first try.

### Usage with [jasmine](http://pivotal.github.io/jasmine/)

Check [jasmineHelpers.js](helpers/jasmineHelpers.js) and [jasmineHelpers2.js](helpers/jasmineHelpers2.js) for jasmine 1.3 and 2.0 respectively.

## API

> _Testing shows the presence, not the absence of bugs._
>
> Edsger W. Dijkstra

To show that propositions hold, we need to construct proofs.
There are two extremes: proof by example (unit tests) and formal (machine-checked) proof.
Property-based testing is somewhere in between.
We formulate propositions, invariants or other properties we believe to hold, but
only test it to hold for numerous (randomly generated) values.

Types and function signatures are written in [Coq](http://coq.inria.fr/)/[Haskell](http://www.haskell.org/haskellwiki/Haskell) influented style:
C# -style `List<T> filter(List<T> v, Func<T, bool> predicate)` is represented by
`filter (v : array T) (predicate : T -> bool) : array T` in our style.

`jsverify` can operate with both synchronous and asynchronous-promise properties.
Generally every property can be wrapped inside [functor](http://learnyouahaskell.com/functors-applicative-functors-and-monoids),
for now in either identity or promise functor, for synchronous and promise properties respectively.


### Properties


- `forall(arbs: arbitrary a ..., prop : a -> property): property`

    Property constructor


- `check (prop: property, opts: checkoptions?): result`

    Run random checks for given `prop`. If `prop` is promise based, result is also wrapped in promise.

    Options:
    - `opts.tests` - test count to run, default 100
    - `opts.size`  - maximum size of generated values, default 5

    - `opts.quiet` - do not `console.log`
    - `opts.rngState` - state string for the rng


- `assert(prop: property, opts: checkoptions?) : void`

    Same as `check`, but throw exception if property doesn't hold.


### Types

- `generator a` is a function `(size: nat) -> a`.
- `show` is a function `a -> string`.
- `shrink` is a function `a -> [a]`, returning *smaller* values.
- `arbitrary a` is a triple of generator, shrink and show functions.
    - `{ generator: nat -> a, shrink : a -> array a, show: a -> string }`


### DSL for input parameters

There is a small DSL to help with `forall`. For example the two definitions below are equivalent:
```js
var bool_fn_applied_thrice = jsc.forall("bool -> bool", "bool", check);
var bool_fn_applied_thrice = jsc.forall(jsc.fn(jsc.bool()), jsc.bool(), check);
```

The DSL is based on a subset of language recognized by [typify-parser](https://github.com/phadej/typify-parser):
- *identifiers* are fetched from the predefined environment.
- *applications* are applied as one could expect: `"array bool"` is evaluated to `jsc.array(jsc.bool)`.
- *functions* are supported: `"bool -> bool"` is evaluated to `jsc.fn(jsc.bool())`.
- *square brackets* are treated as a shorthand for the array type: `"[nat]"` is evaluated to `jsc.array(jsc.nat)`.



### Primitive arbitraries


- `integer: arbitrary integer`
- `integer(maxsize: nat): arbitrary integer`

    Integers, ℤ


- `nat: arbitrary nat`
- `nat(maxsize: nat): arbitrary nat`

    Natural numbers, ℕ (0, 1, 2...)


- `number: arbitrary number`
- `number(maxsize: number): arbitrary number`

    JavaScript numbers, "doubles", ℝ. `NaN` and `Infinity` are not included.


- `uint8: arbitrary nat`
- `uint16: arbitrary nat`
- `uint32: arbitrary nat`


- `int8: arbitrary integer`
- `int16: arbitrary integer`
- `int32: arbitrary integer`


- `bool: generator bool`

    Booleans, `true` or `false`.


- `elements(args: array a): generator a`

    Random element of `args` array.


- `char: generator char`

    Single character


- `asciichar: generator char`

    Single ascii character (0x20-0x7e inclusive, no DEL)


- `string: generator string`


- `asciistring: generator string`


- `json: generator json`

     JavaScript Objects: boolean, number, string, array of `json` values or object with `json` values.

- `value: generator json`



### Arbitrary combinators


- `nonshrink(arb: arbitrary a): arbitrary a`

    Non shrinkable version of arbitrary `arb`.


- `array(arb: arbitrary a): arbitrary (array a)`


- `pair(arbA: arbitrary a, arbB : arbitrary b): arbitrary (pair a b)`

    If not specified `a` and `b` are equal to `value()`.


- `map(arb: arbitrary a): arbitrary (map a)`

    Generates a JavaScript object with properties of type `A`.


- `oneof(gs : array (arbitrary a)...) : arbitrary a`

    Randomly uses one of the given arbitraries.


- `record(spec: { key: arbitrary a... }): arbitrary { key: a... }`

    Generates a javascript object with given record spec.



- `fn(gen: generator a): generator (b -> a)`
- `fun(gen: generator a): generator (b -> a)`
    Unary functions.



### Generator functions


- `generator.array(gen: Gen a, size: nat): gen (array a)`


- `generator.string(size: nat): gen string`


- `generator.map(gen: gen a, size: nat): gen (map a)`


- `generator.json: gen json`


- `generator.oneof(gen: list (gen a), size: nat): gen a`



### Shrink functions


- `shrink.noop(x: a): array a`


- `shrink.tuple(shrinks: (a -> array a, b -> array b...), x: (a, b...)): array (a, b...)`


- `shrink.array(shrink: a -> array a, x: array a): array (array a)`


- `shrink.record(shrinks: { key: a -> string... }, x: { key: a... }): array { key: a... }`



### Show functions


- `show.def(x : a): string`


- `show.tuple(shrinks: (a -> string, b -> string...), x: (a, b...)): string`


- `show.array(shrink: a -> string, x: array a): string`



### Random functions


- `random(min: int, max: int): int`

    Returns random int from `[min, max]` range inclusively.

    ```js
    getRandomInt(2, 3) // either 2 or 3
    ```


- `random.number(min: number, max: number): number`

    Returns random number from `[min, max)` range.



### Utility functions


- `utils.isEqual(x: json, y: json): bool`

    Equality test for `json` objects.


- `utils.force(x: a | () -> a) : a`

    Evaluate `x` as nullary function, if it is one.



## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style.

- Add unit tests for any new or changed functionality.
- Lint and test your code using `make test`.
- Use `make istanbul` to run tests with coverage with [istanbul](http://gotwarlost.github.io/istanbul/).
- Create a pull request

### Before release

Don't add `README.md` or `jsverify.standalone.js` into pull requests.
They will be regenerated before each release.

- run `make dist`

## Release History

- 0.4.0 *2014-10-27* typify-dsl &amp; more arbitraries.
    Changes from 0.3.6:
    - DSL for `forall` and `suchthat`
    - new primitive arbitraries
    - `oneof` behaves as in QuickCheck (BREAKING CHANGE)
    - `elements` is new name of old `oneof`
    - Other smaller stuff under the hood
- 0.4.0-beta.4 generator.oneof
- 0.4.0-beta.3 Expose shrink and show modules
- 0.4.0-beta.2 Move everything around
    - Better looking README.md!
- 0.4.0-beta.1 Beta!
    - Dev Dependencies update
- 0.4.0-alpha8 oneof &amp; record -dsl support
    - also `jsc.compile`
    - record is shrinkable!
- 0.4.0-alpha7 oneof &amp; record
    - *oneof* and *record* generator combinators ([@fson](https://github.com/fson))
    - Fixed uint\* generators
    - Default test size increased to 10
    - Numeric generators with size specified are independent of test size ([#20](https://github.com/phadej/jsverify/issues/20))
- 0.4.0-alpha6 more primitives
    - int8, int16, int32, uint8, uint16, uint32
    - char, asciichar and asciistring
    - value &rarr; json
    - use eslint
- 0.4.0-alpha5 move david to be devDependency
- 0.4.0-alpha4 more typify
    - `suchchat` supports typify dsl
    - `oneof` &rarr; `elements` to be in line with QuickCheck
    - Added versions of examples using typify dsl
- 0.4.0-alpha3 David, npm-freeze and jscs
- 0.4.0-alpha2 Fix typo in readme
- 0.4.0-alpha1 typify
   - DSL for `forall`
       ```js
       var bool_fn_applied_thrice = jsc.forall("bool -> bool", "bool", check);
       ```

   - generator arguments, which are functions are evaluated. One can now write:
       ```js
       jsc.forall(jsc.nat, check) // previously had to be jsc.nat()
       ```

- 0.3.6 map generator
- 0.3.5 Fix forgotten rngState in console output
- 0.3.4 Dependencies update
- 0.3.3 Dependencies update
- 0.3.2 `fun` &rarr; `fn`
- 0.3.1 Documentation typo fixes
- 0.3.0 Major changes
    - random generate state handling
    - `--jsverifyRngState` parameter value used when run on node
    - karma tests
    - use make
    - dependencies update
- 0.2.0 Use browserify
- 0.1.4 Mocha test suite
    - major cleanup
- 0.1.3 gen.show and exception catching
- 0.1.2 Added jsc.assert
- 0.1.1 Use grunt-literate
- 0.1.0 Usable library
- 0.0.2 Documented preview
- 0.0.1 Initial preview

## Related work

### JavaScript

- [JSCheck](http://www.jscheck.org/)
- [claire](https://npmjs.org/package/claire)
- [gent](https://npmjs.org/package/gent)
- [fatcheck](https://npmjs.org/package/fatcheck)
- [quickcheck](https://npmjs.org/package/quickcheck)
- [qc.js](https://bitbucket.org/darrint/qc.js/)
- [quick\_check](https://www.npmjs.org/package/quick_check)

### Others

- [Wikipedia - QuickCheck](http://en.wikipedia.org/wiki/QuickCheck)
- [Haskell - QuickCheck](http://hackage.haskell.org/package/QuickCheck) [Introduction](http://www.haskell.org/haskellwiki/Introduction_to_QuickCheck1)
- [Erlang - QuviQ](http://www.quviq.com/index.html)
- [Erlang - triq](https://github.com/krestenkrab/triq)
- [Scala - ScalaCheck](https://github.com/rickynils/scalacheck)
- [Clojure - test.check](https://github.com/clojure/test.check)

The MIT License (MIT)

Copyright (c) 2013, 2014 Oleg Grenrus

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
