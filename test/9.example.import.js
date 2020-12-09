/* eslint-disable */
/**
 * @flow
 */
import * as React from 'react'

export default function Hello({ name = 'World' }: { name: string }): React.Node {
  return <p>Hello, {name}!</p>;
}
