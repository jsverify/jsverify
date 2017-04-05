import * as jsc from "../lib/jsverify.js";

const arbitrary1: jsc.Arbitrary<jsc.Addend<'foo' | boolean>> = jsc.sum([
    jsc.constant<'foo' | boolean>('foo'),
    jsc.constant<'foo' | boolean>(true)
]);

const arbitrary2: jsc.Arbitrary<any> = jsc.sum([
    jsc.constant('foo'),
    jsc.constant(true)
]);
