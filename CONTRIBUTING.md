## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style.

- Add unit tests for any new or changed functionality.
- Lint and test your code using [Grunt](http://gruntjs.com/).
- Use `istanbul cover grunt simplemocha` to run tests with coverage with [istanbul](http://gotwarlost.github.io/istanbul/).
- Create a pull request

### Before release

Don't add `README.md` or `jsverify.standalone.js` into pull requests.
They will be regenerated before each release.

- run `npm run-script prepare-release`
   - run `grunt literate` to regenerate `README.md`
   - run `npm run-script browserify` to regenerate `jsverify.standalone.js`
