/**
 * @flow
 */
import React from "react";

export default function Hello({name = "World"}: {name: string}) {
  return <p>Hello, {name}!</p>;
}
