/* jshint node: true */
"use strict";

var generator = new (require("rc4").RC4small)();

/**
  #### random (min max : int) : int

  Returns random int from `[min, max]` range inclusively.

  ```js
  getRandomInt(2, 3) // either 2 or 3
  ```
*/
function randomInteger(min, max) {
  return generator.random(min, max);
}

/**
  #### random.number (min max : number) : number

  Returns random number from `[min, max)` range.
*/
function randomNumber(min, max) {
  return generator.randomFloat() * (max - min) + min;
}

randomInteger.integer = randomInteger;
randomInteger.number = randomNumber;

module.exports = randomInteger;
