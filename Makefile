.PHONY : all test jshint karma mocha istanbul dist literate

JSHINT=node_modules/.bin/jshint
MOCHA=node_modules/.bin/_mocha
ISTANBUL=node_modules/.bin/istanbul
KARMA=node_modules/.bin/karma
BROWSERIFY=node_modules/.bin/browserify

all : jshint

test : jshint mocha

jshint : 
	$(JSHINT) lib test

tests-bundle.js : test/*
	$(BROWSERIFY) -r underscore -r lodash -r q -r when -o tests-bundle.js test/*.js

karma : tests-bundle.js
	$(KARMA) start

mocha : 
	$(MOCHA) --reporter spec test

istanbul : 
	$(ISTANBUL) cover $(MOCHA) test

dist : test karma literate
	git clean -fdx -e node_modules
	$(BROWSERIFY) --no-detect-globals -s jsc -o dist/jsverify.standalone.js ./lib/jsverify.js

literate : 
	grunt literate
