.PHONY : all test jshint eslint jscs karma mocha istanbul npm-freeze david dist literate

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

SRC=lib test examples helpers karma.conf.js karma.jasmine.conf.js

jshint :
	$(JSHINT) $(SRC)

eslint :
	$(ESLINT) $(SRC)

jscs :
	$(JSCS) $(SRC)

tests-bundle.js : test/*
	$(BROWSERIFY) -r underscore -r lodash -r q -r when -o tests-bundle.js test/*.js

karma : tests-bundle.js
	$(KARMA) start

jasmine : $(DIST)
	$(KARMA) start karma.jasmine.conf.js

mocha :
	$(MOCHA) --reporter spec test

istanbul :
	$(ISTANBUL) cover -- $(IMOCHA) --timeout 10000 test
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

literate :
	$(LJS) --no-code -o README.md lib/jsverify.js
