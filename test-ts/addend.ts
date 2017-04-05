import * as jsc from "../lib/jsverify.js";

const addend: jsc.Addend<string> = jsc.addend(1, 2, 'foo');

const idx: number = addend.idx;
const len: number = addend.len;
const value: string = addend.value;

const foldResult: boolean = addend.fold((idx: number, len: number, value: string) => true);
