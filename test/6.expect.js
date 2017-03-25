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
    message: "number:  This type is incompatible with the expected param type of 'object type'. See line 5",
    start: 9,
    type: 'default'
  },
  {
    end: 11,
    loc: {
      end: {
        column: 17,
        line: 11,
        offset: 132
      },
      start: {
        column: 1,
        line: 11,
        offset: 115
      }
    },
    message: "function call:  'property `baz`'. See line 5. Property not found in 'object literal'. See line 11",
    start: 11,
    type: 'default'
  }
];
