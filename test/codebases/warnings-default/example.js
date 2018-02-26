// @flow

/*
 * This file shouldn't trigger any warnings despite the fact
 * that unclear-type was set to warn and indentity's argument
 * `x` being of unclear type.  This is because flow's default
 * behavior is to suppress warnings in the CLI output unless
 * `include_warnings` is turned on in your options.
 */

function identity(x: any) {
  return x;
}
