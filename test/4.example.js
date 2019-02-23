/* eslint-disable */
/**
 * @flow
 */
import React, { Component } from 'react';

type Props = {
  firstName: number,
  lastName: string
};

class Foo extends Component<Props, {}> {
  props: Props

  render() {
    return (
      <div>
        <h1>
          Hello {this.props.firstName} {this.props.lastName}
        </h1>
      </div>
    );
  }
}

export default class Bar extends Component<{}, {}> {
  render() {
    return <Foo firstName="John" />;
  }
}
