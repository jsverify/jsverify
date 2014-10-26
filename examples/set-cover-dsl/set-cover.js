/**
  # Minimum set cover

  [Wikipedia](http://en.wikipedia.org/wiki/Set_cover_problem):

  > The set covering problem (SCP) is a classical question in combinatorics, computer science and complexity theory.
*/

/**
  ## Prelude
*/
"use strict";

var _ = require("lodash");
var jsc = require("../../lib/jsverify.js");

/**
  We will want to see *jsverify* output.
*/
var jscOptions = { quiet: false };

/**
  and we will also need a *subset relation*, `⊂`
*/
function isSubset(a, b) {
  var alen = a.length;
  for (var i = 0; i < alen; i++) {
    if (!_.contains(b, a[i])) {
      return false;
    }
  }
  return true;
}

/**
  Let's test `isSubset` right away.
  In TDD we should write the tests first,
  but in a single [ljs](https://github.com/phadej/ljs)-powered literate script that is unfortunately impossible.
*/

/** We could start with testing *reflexivity*: `∀ l, l ⊂ l`. */
jsc.check(jsc.forall("array nat", function (ls) {
  return isSubset(ls, ls);
}), jscOptions);
/**
  > OK, passed 100 tests
*/

/** And one negative test: `∀ l x, ¬ x ∈ l → ¬ ({x} ∪ l) ⊂ l`.*/
jsc.check(jsc.forall("array nat", function (ls) {
  return jsc.forall(jsc.suchthat("nat", function (x) { return !_.contains(ls, x); }), function (x) {
    return !isSubset([x].concat(ls), ls);
  });
}), jscOptions);
/**
  > OK, passed 100 tests
*/

/** We could also write a slightly more convinient version, remembering that `∀ p q, p → q ≡ ¬p ∨ q`: */
jsc.check(jsc.forall("array nat", "nat", function (ls, x) {
  return _.contains(ls, x) || !isSubset([x].concat(ls), ls);
}));
/**
  > OK, passed 100 tests

  However this version will generate some unuseful inputs, where prerequisite doesn't hold.
*/

/**
  ## Model

  We define a greedy solver to the problem. It doesn't give an optimal solution,
  but it is easier to verify that the solver is correct.
*/
function greedy(ls) {
  var acc = [];
  var len = ls.length;
  for (var i = 0; i < len; i++) {
    if (!isSubset(ls[i], _.flatten(acc))) {
      acc.push(ls[i]);
    }
  }
  return acc;
}

/** Single example: */
console.log("Greedy example:", greedy([[1, 2, 3], [3], [4], [3, 4, 5], [4, 5], [1]]));
/**
  > Greedy example: [ [ 1, 2, 3 ], [ 4 ], [ 3, 4, 5 ] ]
*/

/**
  ## Verifying model

  We will use properties described in [the blog post by Jessica Kerr](http://blog.jessitron.com/2013/04/property-based-testing-what-is-it.html).
  Actually, the idea of this example is originated from that post.

  ### 1. Every element in the input is also in the output

*/
function soundProp(input, output) {
  return isSubset(_.flatten(input), _.flatten(output));
}
jsc.check(jsc.forall("array (array nat)", function (ls) {
  return soundProp(ls, greedy(ls));
}), jscOptions);
/** > OK, passed 100 tests */

/**
  ### 2. Every output set was in the input

  Counter example: `_.range(_.min(input), _.max(input))` will satisfy (1) but not (2).
*/
function completeProp(input, output) {
  return isSubset(output, input);
}
jsc.check(jsc.forall("array (array nat)", function (ls) {
  return completeProp(ls, greedy(ls));
}), jscOptions);
/** > OK, passed 100 tests */

/**
  ### 3. The quantity of output sets is less than or equal to the input

  We aim for minimality.
*/
function smallerProp(input, output) {
  return input.length >= output.length;
}
jsc.check(jsc.forall("array (array nat)", function (ls) {
  return smallerProp(ls, greedy(ls));
}), jscOptions);
/** > OK, passed 100 tests */

/**
  ### 4. The same set never appears more than once in the output

  Counter example could be the function operating: `[[1], [1], [1]] → [[1], [1]]`. That would satisfy (1)—(3)!
*/
function toString(x) {
  return "" + x;
}
function uniqueProp(input, output) {
  // Here we need to cheat a bit, as lodash' doesn't have `uniq` taking a comparator!
  return _.uniq(output, false, toString).length === output.length;
}
jsc.check(jsc.forall("array (array nat)", function (ls) {
  return uniqueProp(ls, greedy(ls));
}), jscOptions);
/** > OK, passed 100 tests */

/**
  ### 5. No output set is a subset of any other output set

  Generalizes (3) and (4)!
*/
function redundancyProp(input, output) {
  var len = output.length;
  for (var i = 0; i < len; i++) {
    for (var j = 0; j < len; j++) {
      if (i === j) {
        continue;
      }

      if (isSubset(output[i], output[j])) {
        return false;
      }
    }
  }
  return true;
}
jsc.check(jsc.forall("array (array nat)", function (ls) {
  return redundancyProp(ls, greedy(ls));
}), jscOptions);
/** > Failed after 11 tests and 2 shrinks. rngState: ...; Counterexample: [[0], [0, 1]]; */

/**
  The failing case makes sense. `greedy` is so trivial, it doesn't satisfy the fifth property.
  Thus we have to improve our solver!

  However we will not alter `greedy` itself, but make a more optimal solver.
*/

/**
  ## Better solver

  This *better* solver is still trivial.
  We sort the input so larger sets are in the beginning, thus the fift property will be satisfied.
*/
function better(ls) {
  var sorted = _.sortBy(ls, function (subls) {
    return -_.uniq(subls).length;
  });
  var ret = greedy(sorted);
  return ret;
}
/**
  Why there is `_.uniq` in `_.sortBy`'s iterator function?

  Because during writing this example, the fifth property still found a counter-example: `[0, 0], [0, 1]]`!
  If we omit `_.uniq`, the input wouldn't be altered, but `[0, 0]` is a subset of `[0, 1]`.
*/

/**
  And we reuse already defined properties. All pass.
*/
jsc.check(jsc.forall("array (array nat)", function (ls) { return soundProp(ls, better(ls)); }), jscOptions);
jsc.check(jsc.forall("array (array nat)", function (ls) { return completeProp(ls, better(ls)); }), jscOptions);
jsc.check(jsc.forall("array (array nat)", function (ls) { return smallerProp(ls, better(ls)); }), jscOptions);
jsc.check(jsc.forall("array (array nat)", function (ls) { return uniqueProp(ls, better(ls)); }), jscOptions);
jsc.check(jsc.forall("array (array nat)", function (ls) { return redundancyProp(ls, better(ls)); }), jscOptions);

/**
  ## Last property

  The very last property is a bit tricky:

  > For every other possible combination of input elements such that (1) is true, the number of sets included is never fewer than the number of sets output by my function.

  We can't really test it exhaustively, yet we do random testing!
  We will use the fact that for some permutation of the input list, even the greedy algorithm will return an optimal solution.
  So we rephrase the property into

  > For every permutation of input set, the numer of sets included in greedy algorithm solution is never fewer than the number of sets output by my function.

  Also generating random permutation is not trivial. But as input is random anyway. we cut corner: we'll split input list at random point and swap the parts.
*/
function optimalProp(input, output, split) {
  var len = input.length;
  var head = input.slice(0, split % len);
  var tail = input.slice(split % len);
  var shuffled = tail.concat(head);
  var greedyResult = greedy(shuffled);

  return output.length <= greedyResult.length;
}

/** Let's first test `greedy` for optimality. */
jsc.check(jsc.forall("array (array nat)", "nat", function (ls, split) { return optimalProp(ls, greedy(ls), split); }), jscOptions);
/**
  > Failed after 2 tests and 8 shrinks. rngState: ...; Counterexample: [[0], [0, 1]]; 1

  That was expected.
*/

/** How does `better` perform? */
jsc.check(jsc.forall("array (array nat)", "nat", function (ls, split) { return optimalProp(ls, better(ls), split); }), jscOptions);
/**
  After running few times thru the file:

  > Failed after 39 tests and 25 shrinks. rngState: ...; Counterexample: [[0, 2], [0, 1, 3], [3, 4, 1]]; 2

  This sounds quite suspicios, but indeed `[[3, 4, 1], [0, 2]]` is more optimal solution than all three sets, as returned by `better`!

  So there is still room to improve. One can define a `evenbetter` solver!
  Yet, the problem is proven to be **NP-complete**, so don't try to much.
*/
