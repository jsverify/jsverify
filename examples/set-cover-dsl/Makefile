.PHONY : all

LJS=../../node_modules/.bin/ljs

all : README.md

README.md : set-cover.js
	$(LJS) -c true -o $@ $<
