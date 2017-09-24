export default [
  {
    end: 12,
    loc: {
      end: {
        column: 3,
        line: 12,
        offset: 171
      },
      start: {
        column: 10,
        line: 9,
        offset: 121
      }
    },
    message:
      "property `lastName`:  Property not found in 'props of React element `Foo`'. See line 25",
    start: 9,
    type: 'default'
  },
  {
    end: 25,
    loc: {
      end: {
        column: 35,
        line: 25,
        offset: 399
      },
      start: {
        column: 12,
        line: 25,
        offset: 375
      }
    },
    message:
      "props of React element `Foo`:  This type is incompatible with 'object type'. See line 9",
    start: 25,
    type: 'default'
  }
];
