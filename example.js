var _ = require("underscore");
var q = require("q");
var jsc = require("./lib/jsverify.js");

// Failing inc
(function () {
    function inc(i) {
        return i + 1;
    }

    var prop = jsc.forall(jsc.integer(), function (i) {
        return inc(i) === i + 2;
    });

    console.log("inc failing:", jsc.check(prop));
}());

// Working inc
(function () {
    function inc(i) {
        return i + 1;
    }

    var prop = jsc.forall(jsc.integer(), function (i) {
        return inc(i) === i + 1;
    });

    console.log("inc fixed:", jsc.check(prop));
}());

// Failing Add
(function () {
    function add(i, j) {
        return i + (j && 1);
    }

    var prop = jsc.forall(jsc.integer(), function (i) {
        return jsc.forall(jsc.integer(), function (j) {
            return add(i, j) === i + j;
        });
    });

    console.log("add failing:", jsc.check(prop));
}());

// Working Add
(function () {
    function add(i, j) {
        return i + j;
    }

    var prop = jsc.forall(jsc.integer(), function (i) {
        return jsc.forall(jsc.integer(), function (j) {
            return add(i, j) === i + j;
        });
    });

    console.log("add fixed:", jsc.check(prop));
}());

// Failing Add3
(function () {
    function add(i, j, k) {
        return i + (j && 1) + k;
    }

    var prop = jsc.forall(jsc.integer(), function (i) {
        return jsc.forall(jsc.integer(), function (j) {
            return jsc.forall(jsc.integer(), function (k) {
                return add(i, j, k) === i + j + k;
            });
        });
    });

    console.log("add3 failing:", jsc.check(prop));
}());

(function () {
    function contains(arr, x) {
        return arr.indexOf(x) !== -1;
    }

    function intersects(a, b) {
        return a.some(function (x) {
            return contains(b, x);
        });
    }

    console.log("intersects([1, 2], [1, 3])", intersects([1, 2], [1, 3]));
    console.log("intersects([1, 2], [3, 4])", intersects([1, 2], [3, 4]));

    /*
    var prop = jsc.forall(jsc.list(), jsc.list(), function (arr1, arr2) {
        return intersects(arr1, arr2) === (_.intersection(arr1, arr2) !== []);
    });
    */

    var prop = jsc.forall(jsc.nonshrinklist(), function (a) {
        return jsc.forall(jsc.nonshrinklist(), function (b) {
            return intersects(a, b) === (_.intersection(a, b) !== []);
        });
    });

    console.log("intersects try 1:", jsc.check(prop));

    var prop2 = jsc.forall(jsc.list(), function (a) {
        return jsc.forall(jsc.list(), function (b) {
            return intersects(a, b) === (_.intersection(a, b) !== []);
        });
    });

    console.log("intersects try 2:", jsc.check(prop2));

    var prop3 = jsc.forall(jsc.list(), function (a) {
        return jsc.forall(jsc.list(), function (b) {
            return intersects(a, b) === (_.intersection(a, b).length !== 0);
        });
    });

    console.log("intersects try 3:", jsc.check(prop3));

    var prop4 = jsc.forall(jsc.list(), function (a) {
        return jsc.forall(jsc.list(), function (b) {
            return q.delay(10).then(function () {
                return intersects(a, b) === (_.intersection(a, b).length !== 0);
            });
        });
    });

    jsc.check(prop4).then(function (res) {
        console.log("intersects try 4:", res);
    });
}());
