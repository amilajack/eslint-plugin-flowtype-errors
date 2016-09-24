eslint-plugin-flowtype-errors
=============================
Get Flowtype errors as ESLint errors!

## Demo
![ESLint Flow Demo](https://github.com/amilajack/eslint-plugin-flowtype-errors/blob/master/flow-demo.gif?raw=true)

## Why?
* Less editor configuration: All you need is an eslint reporter plugin. No need to install flow specific tools!
* Simple: Its literally just an ESLint rule! Just install the dependency, add a flowconfig, and you're good to go!

## Getting Started
This guide assumes that you have installed eslint, babel, babel-plugin-transform-flow-strip-types and configured flow. The from-scratch guide is [here](https://github.com/amilajack/eslint-plugin-flowtype-errors/wiki/Getting-Started)

**Step 1. Install**

```bash
npm install --save-dev eslint-plugin-flowtype-errors
```

**Step 2. Configure**

Add this line to the 'rules' section of your `.eslintrc`
```
"flowtype-errors/show-errors": 2,
```

Add this line to the 'plugins' section of your `.eslintrc`
```
"flowtype-errors"
```

Add the `@flow` pragma to files that you want to lint
```
/**
 * @flow
 */
```

Run `eslint` and and you're all set!

## Planned Implementations
* Add Tests
* Add Windows support
* Run flow minimal amount of times

## Caution
**Highly experimental!**
**Windows is not supported at the moment!**
