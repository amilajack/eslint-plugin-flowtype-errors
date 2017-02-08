eslint-plugin-flowtype-errors
=============================

[![Build Status](https://travis-ci.org/amilajack/eslint-plugin-flowtype-errors.svg?branch=master)](https://travis-ci.org/amilajack/eslint-plugin-flowtype-errors)
[![Build status](https://ci.appveyor.com/api/projects/status/ag1pm0a914bed8c8/branch/master?svg=true)](https://ci.appveyor.com/project/amilajack/eslint-plugin-flowtype-errors/branch/master)
[![NPM version](https://badge.fury.io/js/eslint-plugin-flowtype-errors.svg)](http://badge.fury.io/js/eslint-plugin-flowtype-errors)
[![Dependency Status](https://img.shields.io/david/amilajack/eslint-plugin-flowtype-errors.svg)](https://david-dm.org/amilajack/eslint-plugin-flowtype-errors)
[![npm](https://img.shields.io/npm/dm/eslint-plugin-flowtype-errors.svg)](https://npm-stat.com/charts.html?package=eslint-plugin-flowtype-errors)

## Demo
![ESLint Flow Demo](https://github.com/amilajack/eslint-plugin-flowtype-errors/blob/master/flow-demo.gif?raw=true)

*NOTE:* This demo is using Atom and the packages `linter`, `linter-eslint`, `language-babel`

## Why?
* **Lower barrier:** Any editor that has ESLint support now supports Flow 🎉
* **Less editor configuration:** No need to change your entire workflow to incoroprate flow. No multiple-linters-per-file nonsense.
* **Simple:** Its literally just an ESLint rule! Just install the dependency, add a flowconfig, and you're good to go!

## Getting Started
This guide assumes that you have installed eslint, babel, babel-plugin-transform-flow-strip-types and configured flow. Check out the [from-scratch guide](https://github.com/amilajack/eslint-plugin-flowtype-errors/wiki/Getting-Started) for the full guide on getting started.

⚠️ Make sure the 64-bit version of your texteditor/IDE. For atom, [see this comment](https://github.com/amilajack/eslint-plugin-flowtype-errors/issues/40#issuecomment-275983387)

**Step 1. Install**

```bash
npm install --save-dev eslint-plugin-flowtype-errors
```

**Step 2. Configure**

Add this line to the 'rules' section of your `.eslintrc`
```js
"flowtype-errors/show-errors": 2
```

Add this line to the 'plugins' section of your `.eslintrc`
```js
"flowtype-errors"
```

Add the `@flow` pragma to files that you want to lint
Also make sure that your `.flowconfig` is in the root of your project directory
```js
/**
 * @flow
 */
```

Run `eslint` and and you're all set!

## CI Configuration
**Flow is supported on all OS's except Windows 32bit. Add [this line](https://github.com/amilajack/eslint-plugin-flowtype-errors/blob/master/appveyor.yml#L12) to appveyor to make tests run properly.**

## Editor Configuration
### Atom
```bash
apm install linter linter-eslint language-babel
```

### Sublime
* https://github.com/SublimeLinter/SublimeLinter3
* https://github.com/roadhump/SublimeLinter-eslint
* https://github.com/babel/babel-sublime

### Others
http://eslint.org/docs/user-guide/integrations#editors

## Planned Implementations
* Add more extensive tests
* Allow passing arguments to flow binary
* Fix column number inconsistencies between ESLint and Flow
* Run flow minimal amount of times for faster linting
* Custom formatting of flow error messages
* Enable rules to allow and disallow specific flow errors

## Also See:
* [babel-plugin-tcomb](https://github.com/gcanti/babel-plugin-tcomb)
* [eslint-plugin-flowtype](https://github.com/gajus/eslint-plugin-flowtype)
