import { execSync } from 'child_process';
import { expect } from 'chai';


describe('Format', () => {
  const collected = execSync('node ./dist/collect.js');
  const parsedJSONArray = JSON.parse(collected);

  it('should have expected properties', done => {
    expect(parsedJSONArray.map(e => (e === false
        ? false
        : {
          end: e.end,
          message: e.message,
          start: e.start
        }
    ))).to.eql([
      {
        message: 'This type is incompatible with the expected return type of string',
        start: 6,
        end: 6
      },
      false,
      {
        message: 'This type is incompatible with the expected return type of boolean',
        start: 5,
        end: 5
      },
      {
        message: 'Could not resolve name identifier `x`',
        start: 9,
        end: 9
      },
      false,
      {
        message: 'This type is incompatible with string',
        start: 16,
        end: 16
      },
      false,
      {
        message: 'This type is incompatible with number',
        start: 16,
        end: 16
      }
    ]);

    for (const e of parsedJSONArray) {
      if (e !== false) {
        expect(e.path).to.be.a('string').that.includes('code.example.js');
      }
    }

    done();
  });
});
