import * as jsc from "../lib/jsverify.js";

describe("basic jsverify usage", () => {
  jsc.property("(b && b) === b", jsc.bool, b => (b && b) === b);

  jsc.property("boolean fn thrice", jsc.fn(jsc.bool), jsc.bool, (f, b) =>
    f(f(f(b))) === f(b)
  );
});
