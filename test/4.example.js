/*
  eslint
  react/prefer-stateless-function: 0,
  react/no-multi-comp: 0,
  react/jsx-filename-extension: 0
*/

/**
 * @flow
 */
import React, { Component } from 'react';

class Foo extends Component {

  props: {
    firstName: Object,
    lastName: string,
  }

  render() {
    return (
      <div>
        <h1>Hello {this.props.firstName} {this.props.lastName}</h1>
      </div>
    );
  }
}

export default class Bar extends Component {
  render() {
    return <Foo firstName="John" />;
  }
}
