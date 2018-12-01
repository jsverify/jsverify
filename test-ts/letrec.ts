import * as jsc from '../lib/jsverify';

const { arb1, arb2 } = jsc.letrec(function (tie) {
    return {
      arb1: jsc.tuple([jsc.nat, jsc.oneof([jsc.constant(null), tie("arb2")])]),
      arb2: jsc.tuple([jsc.bool, jsc.oneof([jsc.constant(null), tie("arb1")])]),
    }
  });