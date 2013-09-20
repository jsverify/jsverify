beforeEach(function () {
	this.addMatchers({
		// Expects that property is synchronous
		toHold: function () {
		var actual = this.actual;
		var notText = this.isNot ? " not" : "";

		var r = jsc.check(actual);

		var counterExampleText = r === true ? "" : "Counter example found: " + JSON.stringify(r.counterexample);

		this.message = function() {
			return "Expected property to " + notText + " to not hold." + counterExampleText;
		};

		return r === true;
		},
	});
});