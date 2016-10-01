/* eslint-disable */
/**
 * @flow
 */
import React, { Component } from 'react'

class Foo extends Component {

  props: {
    firstName: string,
    lastName: string,
  }

  render() {
    return (
      <div>
        <h1>Hello {this.props.firstName} {this.props.lastName}</h1>
      </div>
    )
  }
}

class Bar extends Component {
  render() {
    return <Foo firstName="John" />
  }
}
