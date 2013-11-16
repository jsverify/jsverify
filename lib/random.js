/* jshint node: true */
"use strict";

/**
  #### getRandomArbitrary (min max : number) : number

  Returns random number from `[min, max)` range.
*/
function randomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

/**
  #### getRandomInt (min max : int) : int

  Returns random int from `[min, max]` range inclusively.

  ```js
  getRandomInt(2, 3) // either 2 or 3
  ```
*/
function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

randomInteger.integer = randomInteger;
randomInteger.number = randomNumber;

module.exports = randomInteger;