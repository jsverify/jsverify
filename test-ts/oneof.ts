import * as jsc from "../lib/jsverify.js";


const arbitrary: jsc.Arbitrary<number> = jsc.oneof([
    jsc.constant(1),
    jsc.constant(2)
]);

const generator: jsc.Generator<number> = jsc.generator.oneof([
    jsc.generator.constant(1),
    jsc.generator.constant(2),
]);
