export default [
  {
    end: 7,
    loc: {
      end: {
        column: 8,
        line: 7,
        offset: 85
      },
      start: {
        column: 5,
        line: 7,
        offset: 81
      }
    },
    message: "number:  This type is incompatible with the expected param type of 'object type'. See ./test/6.example.js:5",
    start: 7,
    type: 'default'
  },
  {
    end: 9,
    loc: {
      end: {
        column: 16,
        line: 9,
        offset: 105
      },
      start: {
        column: 5,
        line: 9,
        offset: 93
      }
    },
    message: "property `baz`:  Property not found in 'object literal'. See ./test/6.example.js:5",
    start: 9,
    type: 'default'
  }
];
