.PHONY : all test test-travis jshint eslint jscs karma mocha istanbul npm-freeze david dist literate README.md

BINDIR=node_modules/.bin

JSHINT=$(BINDIR)/jshint
ESLINT=$(BINDIR)/eslint
JSCS=$(BINDIR)/jscs
MOCHA=$(BINDIR)/mocha
IMOCHA=$(BINDIR)/_mocha
ISTANBUL=$(BINDIR)/istanbul
KARMA=$(BINDIR)/karma
BROWSERIFY=$(BINDIR)/browserify
LJS=$(BINDIR)/ljs
DAVID=$(BINDIR)/david
NPMFREEZE=$(BINDIR)/npm-freeze

DIST=dist/jsverify.standalone.js

all : test

test : jshint eslint jscs mocha istanbul david npm-freeze

test-travis : test test-readme

SRC=lib test fail examples helpers karma.conf.js karma.jasmine.conf.js

jshint :
	$(JSHINT) $(SRC)

eslint :
	$(ESLINT) $(SRC)

jscs :
	$(JSCS) $(SRC)

tests-bundle.js : test/*
	$(BROWSERIFY) -r underscore -r lodash -r q -r when -r bluebird -o tests-bundle.js test/*.js

karma : tests-bundle.js
	$(KARMA) start

jasmine : $(DIST)
	$(KARMA) start karma.jasmine.conf.js

mocha :
	$(MOCHA) --reporter spec test
	$(MOCHA) fail >/dev/null || test $$? -eq 12  # There are 12 "should fail" fixtures

istanbul :
	$(ISTANBUL) cover -- $(IMOCHA) --reporter dot --timeout 10000 test
	test -f coverage/coverage.json
	$(ISTANBUL) check-coverage --statements -2 --branches -3 --functions 100 coverage/coverage.json

dist : test karma jasmine literate $(DIST)
	git clean -fdx -e node_modules

david :
	$(DAVID)

npm-freeze :
	$(NPMFREEZE) check || true

npm-freeze-manifest : npm-freeze-manifest.json

npm-freeze-manifest.json :
	$(NPMFREEZE) manifest

$(DIST) : lib/*
	$(BROWSERIFY) --no-detect-globals -s jsc -o $(DIST) ./lib/jsverify.js

literate : README.md

README.md :
	$(LJS) --no-code -o README.md lib/jsverify.js

test-readme : literate
	git diff --exit-code || (echo "README.md is generated file, run 'make README.md'" && false)
