/* eslint-disable */
/**
 * @flow
 */
export function square(x: number) {
  return x * x;
}

export function moo(): number {
  return 'undefined';
}

export function who(some: string): number {
  return some;
}

var str: number = 'hello world!';

const who = {};

moo(str + who);
