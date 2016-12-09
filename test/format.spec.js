/*
  eslint global-require: 0,
  import/no-dynamic-require: 0,
  no-restricted-syntax: 0
*/
import { expect } from 'chai';
import path from 'path';
import { readFileSync } from 'fs';
import collect from '../src/collect';


const testFilenames = [
  '1.example.js',
  '2.example.js',
  '3.example.js',
  '4.example.js',
  '5.example.js',
  '6.example.js',
  '7.example.js'
];

const testResults = testFilenames.map((filename, index) => {
  const root = process.cwd();
  const filepath = path.join(root, `./test/${filename}`);
  const stdin = readFileSync(filepath).toString();
  const parsedJSONArray = collect(stdin, root, filepath);

  return { parsedJSONArray, filename, index };
});

describe('Format', () => {
  for (const { parsedJSONArray, filename } of testResults) {
    it(`${filename} - should have expected properties`, done => {
      const exactFormat = require(`./${filename}`.replace('example', 'expect'));

      expect(parsedJSONArray).to.be.an('array');

      // Filter out the 'path' property because this changes between environments
      expect(parsedJSONArray.map(e => ({
        end: e.end,
        type: e.type,
        loc: { start: e.loc.start, end: e.loc.end },
        message: e.message,
        start: e.start
      }))).to.eql(exactFormat);

      for (const e of parsedJSONArray) {
        if (e !== false) {
          expect(e.type).to.be.a('string');
          expect(e.path).to.be.a('string').that.includes(path.join(process.cwd(), 'test'));
          expect(e.path).to.be.a('string').that.includes('.example.js');
        }
      }

      done();
    });
  }
});
