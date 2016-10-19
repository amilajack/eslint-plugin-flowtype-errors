export default [
  {
    end: 9,
    loc: {
      end: {
        column: 8,
        line: 9,
        offset: 111
      },
      start: {
        column: 5,
        line: 9,
        offset: 107
      }
    },
    message: "number:  This type is incompatible with 'object type'. See ./test/6.example.js:5",
    start: 9,
    type: 'default'
  },
  {
    end: 5,
    loc: {
      end: {
        column: 38,
        line: 5,
        offset: 76
      },
      start: {
        column: 26,
        line: 5,
        offset: 63
      }
    },
    message: "property `baz`:  Property not found in 'object literal'. See ./test/6.example.js:11",
    start: 5,
    type: 'default'
  }
];
