# Minimum set cover

[Wikipedia](http://en.wikipedia.org/wiki/Set_cover_problem):

> The set covering problem (SCP) is a classical question in combinatorics, computer science and complexity theory.


## Prelude


We will want to see *jsverify* output.


and we will also need a *subset relation*, `⊂`


Let's test `isSubset` right away.
In TDD we should write the tests first,
but in a single [ljs](https://github.com/phadej/ljs)-powered literate script that is unfortunately impossible.


We could start with testing *reflexivity*: `∀ l, l ⊂ l`. 

> OK, passed 100 tests


And one negative test: `∀ l x, ¬ x ∈ l → ¬ ({x} ∪ l) ⊂ l`.

> OK, passed 100 tests


We could also write a slightly more convinient version, remembering that `∀ p q, p → q ≡ ¬p ∨ q`: 

> OK, passed 100 tests

However this version will generate some unuseful inputs, where prerequisite doesn't hold.


## Model

We define a greedy solver to the problem. It doesn't give an optimal solution,
but it is easier to verify that the solver is correct.


Single example: 

> Greedy example: [ [ 1, 2, 3 ], [ 4 ], [ 3, 4, 5 ] ]


## Verifying model

We will use properties described in [the blog post by Jessica Kerr](http://blog.jessitron.com/2013/04/property-based-testing-what-is-it.html).
Actually, the idea of this example is originated from that post.

### 1. Every element in the input is also in the output



> OK, passed 100 tests 

### 2. Every output set was in the input

Counter example: `_.range(_.min(input), _.max(input))` will satisfy (1) but not (2).


> OK, passed 100 tests 

### 3. The quantity of output sets is less than or equal to the input

We aim for minimality.


> OK, passed 100 tests 

### 4. The same set never appears more than once in the output

Counter example could be the function operating: `[[1], [1], [1]] → [[1], [1]]`. That would satisfy (1)—(3)!


> OK, passed 100 tests 

### 5. No output set is a subset of any other output set

Generalizes (3) and (4)!


> Failed after 11 tests and 2 shrinks. rngState: ...; Counterexample: [[0], [0, 1]]; 

The failing case makes sense. `greedy` is so trivial, it doesn't satisfy the fifth property.
Thus we have to improve our solver!

However we will not alter `greedy` itself, but make a more optimal solver.


## Better solver

This *better* solver is still trivial.
We sort the input so larger sets are in the beginning, thus the fift property will be satisfied.


Why there is `_.uniq` in `_.sortBy`'s iterator function?

Because during writing this example, the fifth property still found a counter-example: `[0, 0], [0, 1]]`!
If we omit `_.uniq`, the input wouldn't be altered, but `[0, 0]` is a subset of `[0, 1]`.


And we reuse already defined properties. All pass.


## Last property

The very last property is a bit tricky:

> For every other possible combination of input elements such that (1) is true, the number of sets included is never fewer than the number of sets output by my function.

We can't really test it exhaustively, yet we do random testing!
We will use the fact that for some permutation of the input list, even the greedy algorithm will return an optimal solution.
So we rephrase the property into

> For every permutation of input set, the numer of sets included in greedy algorithm solution is never fewer than the number of sets output by my function.

Also generating random permutation is not trivial. But as input is random anyway. we cut corner: we'll split input list at random point and swap the parts.


Let's first test `greedy` for optimality. 

> Failed after 2 tests and 8 shrinks. rngState: ...; Counterexample: [[0], [0, 1]]; 1

That was expected.


How does `better` perform? 

After running few times thru the file:

> Failed after 39 tests and 25 shrinks. rngState: ...; Counterexample: [[0, 2], [0, 1, 3], [3, 4, 1]]; 2

This sounds quite suspicios, but indeed `[[3, 4, 1], [0, 2]]` is more optimal solution than all three sets, as returned by `better`!

So there is still room to improve. One can define a `evenbetter` solver!
Yet, the problem is proven to be **NP-complete**, so don't try to much.
