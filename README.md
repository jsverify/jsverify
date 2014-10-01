# JSVerify

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
var bool_fn_applied_thrice =
  jsc.forall("bool -> bool", "bool", function (f, b) {
    return f(f(f(b))) === f(b);
  });

jsc.assert(bool_fn_applied_thrice);
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

Some type definitions to keep developers sane:

- Functor f => property (size : nat) : f result
- result := true | { counterexample: any }
- Functor f => property_rec := f (result | property)
- generator a := { arbitrary : a, shrink : a -> [a] }


### Properties


#### forall (gens : generator a ...) (prop : a -> property_rec) : property

Property constructor


#### check (prop : property) (opts : checkoptions) : promise result + result

Run random checks for given `prop`. If `prop` is promise based, result is also wrapped in promise.

Options:
- `opts.tests` - test count to run, default 100
- `opts.size`  - maximum size of generated values, default 5
- `opts.quiet` - do not `console.log`
- `opts.rngState` - state string for the rng


#### assert (prop : property) (opts : checkoptions) : void

Same as `check`, but throw exception if property doesn't hold.


### DSL for input parameters

There is a small DSL to help with `forall`. For example the two definitions below are equivalent:
```js
var bool_fn_applied_thrice = jsc.forall("bool -> bool", "bool", check);
var bool_fn_applied_thrice = jsc.forall(jsc.fn(jsc.bool()), jsc.bool(), check);

The DSL is based on a subset of language recognized by [typify-parser](https://github.com/phadej/typify-parser):
- *identifiers* are fetched from the predefined environment.
- *applications* are applied as one could expect: `"array bool"` is evaluated to `jsc.array(jsc.bool)`.
- *functions* are supported: `"bool -> bool"` is evaluated to `jsc.fn(jsc.bool())`.
- *square brackets* are treated as a shorthand for the array type: `"[nat]"` is evaulated to `jsc.array(jsc.nat)`.



### Primitive generators


#### integer (maxsize : nat) : generator integer

Integers, ℤ


#### nat (maxsize : nat) : generator nat

Natural numbers, ℕ (0, 1, 2...)


#### number (maxsize : number) : generator number

JavaScript numbers, "doubles", ℝ. `NaN` and `Infinity` are not included.


#### bool () : generator bool

Booleans, `true` or `false`.


#### oneof (args : array any) : generator any

Random element of `args` array.


#### string () : generator string

Strings


#### value : generator value

JavaScript value: boolean, number, string, array of values or object with `value` values.



#### array (gen : generator a) : generator (array a)


#### pair (a : generator A) (b : generator B) : generator (A * B)

If not specified `a` and `b` are equal to `value()`.


#### map (gen : generator A) : generator (map A)

Generates a javascript object with properties of type `A`.



#### fn (gen : generator a) : generator (b -> a)

Unary functions.

_fun_ alias for _fn_



### Generator combinators


#### suchthat (gen : generator a) (p : a -> bool) : generator {a | p a == true}

Generator of values that satisfy `p` predicate. It's adviced that `p`'s accept rate is high.


#### nonshrink (gen : generator a) : generator a

Non shrinkable version of generator `gen`.



### jsc._ - miscellaneous utilities

#### assert (exp : bool) (message : string) : void

Throw an error with `message` if `exp` is falsy.
Resembles [node.js assert](http://nodejs.org/api/assert.html).


#### isEqual (a b : value) : bool

Equality test for `value` objects. See `value` generator.



#### random (min max : int) : int

Returns random int from `[min, max]` range inclusively.

```js
getRandomInt(2, 3) // either 2 or 3
```


#### random.number (min max : number) : number

Returns random number from `[min, max)` range.



#### FMap (eq : a -> a -> bool) : FMap a

Finite map, with any object a key.

Short summary of member functions:

- FMap.insert (key : a) (value : any) : void
- FMap.get (key : a) : any
- FMap.contains (key : a) : obool



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
