/* eslint-disable */
/**
 * @flow
 */
type Foo = {} & ({ a: Array<string> } | { b: string });

function foo(a: Foo) {
  if ('b' in a) {
    a.foo.map(e => e(e))
  }
}
