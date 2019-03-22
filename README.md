eslint-plugin-flowtype-errors
=============================

[![Build Status](https://dev.azure.com/amilajack/amilajack/_apis/build/status/amilajack.eslint-plugin-flowtype-errors?branchName=master)](https://dev.azure.com/amilajack/amilajack/_build/latest?definitionId=1&branchName=master)
[![NPM version](https://badge.fury.io/js/eslint-plugin-flowtype-errors.svg)](http://badge.fury.io/js/eslint-plugin-flowtype-errors)
[![Dependency Status](https://img.shields.io/david/amilajack/eslint-plugin-flowtype-errors.svg)](https://david-dm.org/amilajack/eslint-plugin-flowtype-errors)
[![npm](https://img.shields.io/npm/dm/eslint-plugin-flowtype-errors.svg)](https://npm-stat.com/charts.html?package=eslint-plugin-flowtype-errors)

## Demo

![ESLint Flow Demo](https://github.com/amilajack/eslint-plugin-flowtype-errors/blob/master/flow-demo.gif?raw=true)

## Why?

* **Lower barrier:** Any editor that has ESLint support now supports Flow 🎉
* **Less editor configuration:** No need to change your entire workflow to incorporate flow. No multiple-linters-per-file nonsense.
* **Simple:** Its literally just an ESLint rule! Just install the dependency, add a flowconfig, and you're good to go!

## Getting Started

This guide assumes that you have installed eslint, babel, babel-plugin-transform-flow-strip-types and configured flow. Check out the [from-scratch guide](https://github.com/amilajack/eslint-plugin-flowtype-errors/wiki/Getting-Started) for the full guide on getting started.

⚠️ Make sure the 64-bit version of your text editor or IDE. For atom, [see this comment](https://github.com/amilajack/eslint-plugin-flowtype-errors/issues/40#issuecomment-275983387)

### **1. Install**

```bash
npm install --save-dev eslint-plugin-flowtype-errors
```

### **2. Configure**

Extend the recommended config:
```jsonc
{
  "extends": ["plugin:flowtype-errors/recommended"]
}
```

## Support

If this project is saving you (or your team) time, please consider supporting it on Patreon 👍 thank you!

<p>
  <a href="https://www.patreon.com/amilajack">
    <img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
  </a>
</p>

## CI Configuration

Flow is supported on all OS's except Windows 32bit. Add [this line](https://github.com/amilajack/eslint-plugin-flowtype-errors/blob/master/appveyor.yml#L12) to appveyor to make tests run properly.

## Related:

* [flow-runtime](https://github.com/codemix/flow-runtime)
* [eslint-plugin-flowtype](https://github.com/gajus/eslint-plugin-flowtype)
* [eslint-plugin-flowtype-errors-demo](https://github.com/amilajack/eslint-plugin-flowtype-errors-demo)
