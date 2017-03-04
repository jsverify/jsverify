declare module 'jsverify' {
    type Arbitrary<T> = ArbitraryLike<T> & ArbitraryFns<T>;

    interface ArbitraryLike<T> {
        generator : Generator<T>;
        show : Show<T>;
        shrink : Shrink<T>;
    }

    interface ArbitraryFns<T> {
        smap<U>(f : (t : T) => U, g : (u : U) => T, newShow? : Show<U>) : Arbitrary<U>;
    }

    function bless<U>(arb : ArbitraryLike<U>) : Arbitrary<U>;

    interface Options {
        tests : number;
        size : number;
        quiet : boolean;
        rngState : string;
    }

    interface Result<T> {
        counterexample : T;
        tests : number;
        shrinks : number;
        exc? : string;
        rngState : string;
    }

    type Generator<T> = GeneratorFn<T> & GeneratorFns<T>;
    type GeneratorFn<T> = (size : number) => T;
    interface GeneratorFns<T> {
        map<U>(f : (t : T) => U) : Generator<U>;
        flatmap<U>(f : (t : T) => Generator<U>) : Generator<U>;
    }

    type Shrink<T> = ShrinkFn<T> & ShrinkFns<T>;
    type ShrinkFn<T> = (t : T) => T[];
    interface ShrinkFns<T> {
        smap<U>(f : (t : T) => U, g : (u : U) => T) : Shrink<U>;
    }

    type Show<T> = (t : T) => string;
    type Property<T> = boolean | void | T;
    type integerFn = (maxsize : number) => Arbitrary<number>;
    type integerFn2 = (minsize : number, maxsize : number) => Arbitrary<number>;

    const integer : Arbitrary<number> & integerFn & integerFn2;
    const nat : Arbitrary<number> & integerFn;
    const number : Arbitrary<number> & integerFn & integerFn2;

    const uint8 : Arbitrary<number>;
    const uint16 : Arbitrary<number>;
    const uint32 : Arbitrary<number>;
    const int8 : Arbitrary<number>;
    const int16 : Arbitrary<number>;
    const int32 : Arbitrary<number>;

    const bool : Arbitrary<boolean>;
    const datetime : Arbitrary<Date>;

    function elements<T>(args : T[]) : Arbitrary<T>;
    const falsy : Arbitrary<any>;
    function constant<T>(x : T) : Arbitrary<T>;

    const char : Arbitrary<string>;
    const asciichar : Arbitrary<string>;
    const string : Arbitrary<string>;
    const nestring : Arbitrary<string>;
    const asciistring : Arbitrary<string>;
    const asciinestring : Arbitrary<string>;

    //Combinators
    function nonShrink<T>(arb : Arbitrary<T>) : Arbitrary<T>;
    function either<T, U>(arbA : Arbitrary<T>, arbB : Arbitrary<U>) : Arbitrary<T | U>;
    function pair<T, U>(arbA : Arbitrary<T>, arbB : Arbitrary<U>) : Arbitrary<[T, U]>;

    function tuple(arbs : Arbitrary<any>[]) : Arbitrary<any[]>;
    function sum(arbs : Arbitrary<any>[]) : Arbitrary<any>;

    function dict<T>(arb : Arbitrary<T>) : Arbitrary<{ [s : string]: T }>;
    function array<T>(arb : Arbitrary<T>) : Arbitrary<T[]>;
    function nearray<T>(arb : Arbitrary<T>) : Arbitrary<T[]>;
    const json : Arbitrary<any>;
    const unit : Arbitrary<any>;

    function oneOf<T>(gs : Arbitrary<T>[]) : Arbitrary<T>;

    //Properties
    function forall<T>(arb1 : Arbitrary<T>, prop : (t : T) => Property<T>) : Property<T>; //TODO: Fix declaration
    function check<T>(prop : Property<T>, opts? : Options) : Result<T>;
    function assert(prop : Property<any>, opts? : Options) : void;

    const generator : GeneratorFunctions;
    const shrink : ShrinkFunctions;
    const show : ShowFunctions;
    const random : Random;

    interface GeneratorFunctions {
        constant<U>(u : U) : Generator<U>;
        //combine<U>(...gen : Generator<any>[], f : (...a : any[]) => U) : Generator<U>; //TODO: Find solution
        oneOf<U>(gens : Generator<U>[]) : Generator<U>;
        recursive<U>(genZ : Generator<U>, f : (u : U) => U) : Generator<U>;
        pair<T, U>(genA : Generator<T>, genB : Generator<U>) : Generator<[T, U]>;
        either<T, U>(genA : Generator<T>, genB : Generator<U>) : Generator<T | U>;

        tuple(gens : Generator<any>[]) : Generator<any[]>;
        sum(gens : Generator<any>[]) : Generator<any>;

        array<U>(gen : Generator<U>) : Generator<U[]>;
        nearray<U>(gen : Generator<U>) : Generator<U[]>;
        dict<U>(gen : Generator<U>) : Generator<{ [key : string]: U }>;

        unit : Generator<any>;
    }

    interface ShrinkFunctions {
        noop : Shrink<any>;
        pair<T, U>(shrA : Shrink<T>, shrB : Shrink<U>) : Shrink<[T, U]>;
        either<T, U>(shrA : Shrink<T>, shrB : Shrink<U>) : Shrink<T | U>;

        tuple(shrs : Shrink<any>[]) : Shrink<any[]>;
        sum(shrs : Shrink<any>[]) : Shrink<any>;

        array<T>(shr : Shrink<T>) : Shrink<T[]>;
        nearray<T>(shr : Shrink<T>) : Shrink<T[]>;
    }

    interface ShowFunctions {
        def<T>(x : T) : string;
        pair<T, U>(sA : Show<T>, sB : Show<U>, x : [T, U]) : string;
        either<T, U>(sA : Show<T>, sB : Show<U>, x : (T | U)) : string;

        tuple(shs : Show<any>[], x : any[]) : string;
        sum(shs : Show<any>[], x : any) : string;

        array<T>(sh : Show<T>, x : T[]) : string;
    }

    type Random = RandomInt & RandomFunctions;
    type RandomInt = (min : number, max : number) => number;
    interface RandomFunctions {
        number(min : number, max : number) : number;
    }
}
