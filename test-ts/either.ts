import * as jsc from "../lib/jsverify.js";

const arbitrary: jsc.Arbitrary<jsc.Either<string, boolean>> = jsc.either(jsc.string, jsc.bool);

const either: jsc.Either<string, boolean> = arbitrary.generator(1)

const value: string | boolean = either.value;

const foo: number = either.either((x: string) => 0, (x: boolean) => 1);
