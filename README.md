
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

### jsc._ - miscellaneous utilities

#### assert (exp : bool) (message : string) : void

Throw an error with `message` if `exp` is falsy.

#### id (x : any) : any

Identity function.

#### isEqual (a b : value) : bool

Equality test for `value` objects. See `value` generator.

#### FMap (eq : a -> a -> bool) : FMap a

Finite map, with any object a key.

Short summary of member functions:

- FMap.insert (key : a) (value : any) : void
- FMap.get (key : a) : any
- FMap.contains (key : a) : obool

#### isPromise p : bool

Optimistic duck-type check for promises.
Returns `true` if p is an object with `.then` function property.

#### withPromise (Functor f) (p : f a) (f : a -> b) : f b

This is functor map, `fmap`, with arguments flipped.
Essentially `f(p)`. If `p` is promise, returns new promise.
Using `withPromise` makes code look very much [CPS-style](http://en.wikipedia.org/wiki/Continuation-passing_style).

#### getRandomArbitrary (min max : number) : number

Returns random number from `[min, max)` range.

#### getRandomInt (min max : int) : int

Returns random int from `[min, max]` range inclusively.

```js
getRandomInt(2, 3) // either 2 or 3
```

### Properties

#### forall (gen : generator a) (prop : a -> property_rec) : property

Property constructor

#### check (prop : property) (opts : checkoptions) : promise result + result

Run random checks for given `prop`. If `prop` is promise based, result is also wrapped in promise.

Options:
- `opts.tests` - test count to run, default 100
- `opts.size`  - maximum size of generated values, default 5
- `opts.quiet` - do not `console.log`

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

#### array (gen : generator a) : generator (array a)

#### value : generator value

JavaScript value: boolean, number, string, array of values or object with `value` values.

**TODO**: currently returns only integers.

#### fun (gen : generator a) : generator (b -> a)

Unary functions.

### Generator combinators

#### pair (a : generator A) (b : generator B) : generator (A * B)

If not specified `a` and `b` are equal to `integer()`.

#### suchthat (gen : generator a) (p : a -> bool) : generator {a | p a == true}

Generator of values that satisfy `p` predicate. It's adviced that `p`'s accept rate is high.

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
