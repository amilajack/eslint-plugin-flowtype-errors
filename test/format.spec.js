import path from 'path';
import { expect as chaiExpect } from 'chai';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { sync as spawnSync } from 'cross-spawn';
import collect from '../src/collect';


const testFilenames = [
  '1.example.js',
  '2.example.js',
  '3.example.js',
  '4.example.js',
  '5.example.js',
  '6.example.js',
  '7.example.js',
  '8.example.js',
  '9.example.js'
];

const testResults = testFilenames.map((filename, index) => {
  const root = process.cwd();
  const filepath = path.join(root, 'test', filename);
  const stdin = readFileSync(filepath).toString();
  const parsedJSONArray = collect(stdin, root, filepath);

  return { parsedJSONArray, filename, index };
});

describe('Format', () => {
  for (const { parsedJSONArray, filename } of testResults) {
    it(`${filename} - should have expected properties`, () => {
      const exactFormat = require(`./${filename}`.replace('example', 'expect'));

      chaiExpect(parsedJSONArray).to.be.an('array');

      // Filter out the 'path' property because this changes between environments
      expect(parsedJSONArray.map(e => ({
        end: e.end,
        type: e.type,
        loc: { start: e.loc.start, end: e.loc.end },
        message: e.message,
        start: e.start
      })))
      .toEqual(exactFormat);

      for (const e of parsedJSONArray) {
        if (e !== false) {
          chaiExpect(e.type).to.be.a('string');
          chaiExpect(e.path).to.be.a('string').that.contains(path.join(process.cwd(), 'test'));
          chaiExpect(e.path).to.be.a('string').that.contains('.example.js');
        }
      }
    });
  }
});

const ESLINT_PATH = path.resolve('./node_modules/eslint/bin/eslint.js');

function runEslint(cwd) {
  const result = spawnSync(ESLINT_PATH, ['**/*.js'], { cwd });
  result.stdout = result.stdout && result.stdout.toString();
  result.stderr = result.stderr && result.stderr.toString();
  return result;
}

const codebases = [
  'no-flow-pragma',
  'project-1'
];

const eslintConfig = `
var Module = require('module');
var path = require('path');
var original = Module._resolveFilename;

// Hack to allow eslint to find the plugin
Module._resolveFilename = function(request, parent, isMain) {
  if (request === 'eslint-plugin-flowtype-errors') {
    return path.resolve('../../../dist/index.js');
  }
  return original.call(this, request, parent, isMain);
};

module.exports = {
  parser: 'babel-eslint',
  root: true, // Make ESLint ignore configuration files in parent folders
  env: {
    node: true,
    es6: true
  },
  plugins: ['flowtype-errors'],
  rules: {
    'flowtype-errors/show-errors': 2
  }
};
`;

describe('Check codebases', () => {
  for (const folder of codebases) {
    it(`${folder} - eslint should give expected output`, () => {
      const fullFolder = path.resolve(`./test/codebases/${folder}`);
      const configPath = path.resolve(fullFolder, '.eslintrc.js');

      // Write config file
      writeFileSync(configPath, eslintConfig);

      // Spawn a eslint process
      const { stdout, stderr } = runEslint(fullFolder);

      const regexp = new RegExp(`^${fullFolder.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')}.+\\.js$`, 'gm'); // Escape regexp

      // Strip root from filenames
      expect(stdout.replace(regexp, match => match.replace(fullFolder, '.').replace(/\\/g, '/'))).toMatchSnapshot();

      expect(stderr).toEqual('');

      // Clean up
      unlinkSync(configPath);
    });
  }
});
