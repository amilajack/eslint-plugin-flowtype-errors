import { execSync } from 'child_process';
import { expect } from 'chai';


describe('Format', () => {
  const collected = execSync('node ./dist/collect.js');
  const parsedJSON = JSON.parse(collected);

  it('should return exact formatting errors', done => {
    expect(parsedJSON).to.eql([
      {
        message: 'This type is incompatible with the expected return type of string',
        path: '/Users/amila/Documents/Projects/eslint-plugin-flowtype-errors/test/code.example.js',
        start: 6,
        end: 6
      },
      false,
      {
        message: 'This type is incompatible with the expected return type of boolean',
        path: '/Users/amila/Documents/Projects/eslint-plugin-flowtype-errors/test/code.example.js',
        start: 5,
        end: 5
      },
      {
        message: 'Could not resolve name identifier `x`',
        path: '/Users/amila/Documents/Projects/eslint-plugin-flowtype-errors/test/code.example.js',
        start: 9,
        end: 9
      },
      false,
      {
        message: 'This type is incompatible with string',
        path: '/Users/amila/Documents/Projects/eslint-plugin-flowtype-errors/test/code.example.js',
        start: 16,
        end: 16
      },
      false,
      {
        message: 'This type is incompatible with number',
        path: '/Users/amila/Documents/Projects/eslint-plugin-flowtype-errors/test/code.example.js',
        start: 16,
        end: 16
      }
    ]);
    done();
  });
});
