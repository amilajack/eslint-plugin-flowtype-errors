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
    message: "number:  This type is incompatible with the expected param type of 'object type'. See ./6.example.js:5",
    start: 7,
    type: 'default'
  },
  {
    end: 9,
    loc: {
      end: {
        column: 17,
        line: 9,
        offset: 106
      },
      start: {
        column: 1,
        line: 9,
        offset: 89
      }
    },
    message: "function call:  'property `baz`'. See ./6.example.js:5. Property not found in 'object literal'. See line 9",
    start: 9,
    type: 'default'
  }
];
