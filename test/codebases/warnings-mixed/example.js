// @flow

/*
 * This file should trigger a warning for `x` being of
 * unclear type and an error for the return statement
 * of incorrectMean since its type doesn't match the
 * hint we gave saying it should be a string.
 */

function identity(x: any) {
  return x;
}

function mean(x): number {
  return x.reduce((acc, cur) => acc + cur) / x.length;
}

function incorrectMean(x): string {
  return x.reduce((acc, cur) => acc + cur) / x.length;
}
