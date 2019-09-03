## v4.2.0
### Added
- Support for libdefs
### Updated
- All dependencies to latest semver

## v4.1.0
### Added
- Recommended config 🎉

## v4.0.0
### Fixed
- Fix Flow `>= v0.71` on Windows
### Added
- Integration with Azure Pipelines
## Updated
- New config lookup
- Upgraded babel, flow, eslint, and all other dependencies to latest semver 🎉🎉🎉 (This may introduce breaking changes)

## v3.6.0
## Updated
- Bumped all deps to latest semver

## v3.5.1
## Fixed
- Fix --json-version=2 support

## v3.5.0
### Added
- Added support for `>=flow@0.66`

## v3.4.0
### Added
- Added `show-warnings` rule.

```js
"flowtype-errors/show-warnings": 1
```

## v3.3.3
### Added
- Improved accuracy of error messages.
### Fixed
- Show error on 32 bit OS's. Closes [#46](https://github.com/amilajack/eslint-plugin-flowtype-errors/issues/46).
- Fixed [#100](https://github.com/amilajack/eslint-plugin-flowtype-errors/issues/100).

## v3.3.2
### Fixed
- Fixed off-by-one error in reported column numbers.

## v3.3.1
- No interesting changes.

## v3.3.0
### Added
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
