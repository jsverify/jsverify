.PHONY : all test jshint karma mocha istanbul dist literate

JSHINT=node_modules/.bin/jshint
MOCHA=node_modules/.bin/_mocha
ISTANBUL=node_modules/.bin/istanbul
KARMA=node_modules/.bin/karma
BROWSERIFY=node_modules/.bin/browserify
LJS=node_modules/.bin/ljs

DIST=dist/jsverify.standalone.js

all : jshint

test : jshint mocha istanbul

jshint : 
	$(JSHINT) lib test

tests-bundle.js : test/*
	$(BROWSERIFY) -r underscore -r lodash -r q -r when -o tests-bundle.js test/*.js

karma : tests-bundle.js
	$(KARMA) start

jasmine : $(DIST)
	$(KARMA) start karma.jasmine.conf.js

mocha : 
	$(MOCHA) --reporter spec test

istanbul : 
	$(ISTANBUL) cover $(MOCHA) test
	$(ISTANBUL) check-coverage --statements -2 --branches -3 --functions 100 coverage/coverage.json

dist : test karma jasmine literate $(DIST)
	git clean -fdx -e node_modules

$(DIST) : lib/*
	$(BROWSERIFY) --no-detect-globals -s jsc -o $(DIST) ./lib/jsverify.js

literate : 
	$(LJS) -c false -o README.md lib/jsverify.js
