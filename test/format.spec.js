import { execSync } from 'child_process';
import { expect } from 'chai';
import path from 'path';


describe('Format', () => {
  const collected = execSync(`node ${path.normalize('./dist/collect.js')}`);
  const parsedJSONArray = JSON.parse(collected);

  it('should have expected properties', done => {
    expect(parsedJSONArray.to.be.an('array'));

    // Filter out the 'path' property because this changes between environments
    expect(parsedJSONArray.map(e => ({
      end: e.end,
      type: e.type,
      message: e.message,
      start: e.start
    }))).to.eql([
      {
        message: 'This type is incompatible with the expected return type of string',
        start: 6,
        end: 6,
        type: 'default'
      },
      {
        message: 'This type is incompatible with the expected return type of boolean',
        start: 5,
        end: 5,
        type: 'default'
      },
      {
        message: 'Could not resolve name identifier `x`',
        start: 9,
        end: 9,
        type: 'default'
      },
      {
        message: 'This type is incompatible with string',
        start: 16,
        end: 16,
        type: 'default'
      },
      {
        message: 'This type is incompatible with number',
        start: 16,
        end: 16,
        type: 'default'
      },
      {
        end: 9,
        message: 'Missing annotation parameter `x`',
        start: 9,
        type: 'missing-annotation'
      },
      {
        end: 13,
        message: 'Could not resolve name identifier `x`',
        start: 13,
        type: 'default'
      }
    ]);

    for (const e of parsedJSONArray) {
      if (e !== false) {
        expect(e.type).to.be.a('string');
        expect(e.path).to.be.a('string').that.includes(path.join(process.cwd(), 'test'));
        expect(e.path).to.be.a('string').that.includes('.example.js');
      }
    }

    done();
  });
});
