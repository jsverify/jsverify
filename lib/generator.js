"use strict";

function force(gen) {
  return (typeof gen === "function") ? gen() : gen;
}

module.exports = {
  force: force,
};
