// @flow

/*
 * This file should trigger a warning for `x` being of
 * unclear type since we set `include_warnings=true`
 * in the `.flowconfig` file.
 */

function identity(x: any) {
  return x;
}
