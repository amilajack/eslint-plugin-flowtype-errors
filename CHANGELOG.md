## Master

- Added `enforce-min-coverage` rule.

```js
"flowtype-errors/enforce-min-coverage": [2, 50]
```

- Added `stopOnExit` setting.

```js
"settings": {
  "flowtype-errors": {
    "stopOnExit": "true"
  }
},
```

## v3.2.1

### Fixed

- Fixed error when type checking folders with spaces on Windows.

## v3.2.0

### Added

- Added `flowDir` setting.

```js
"settings": {
  "flowtype-errors": {
    "flowDir": "./myDir"
  }
},
```

## v3.0.3

### Fixed

- Fixed bug that suppressed jsx errors

## v3.0.2

### Updated

- `flow-bin@0.39.0` -> `flow-bin@0.42.0`

## v3.0.1

### Added

- Support for node >= 4

## v3.0.0

### Added

- Support for reporting type errors from type declarations in imported modules, fixes https://github.com/amilajack/eslint-plugin-flowtype-errors/issues/33 Huge thanks to @jdmota 🎉
- Updated all dependencies, requires at least `flow@0.38.0`
- Stricter tests

## v2.0.0

### Changed

- Require `flow-bin` as a `peerDependency`
- Updated all dependencies
- Migrated to Jest

## v1.0.0

Initial stable release
