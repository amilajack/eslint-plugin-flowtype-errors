/* eslint-disable no-nested-ternary */
import path from 'path';
import { expect as chaiExpect } from 'chai';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
// $FlowIgnore
import execa from 'execa';
import { collect } from '../src/collect';

jest.setTimeout(process.platform === 'win32' ? 30000 : 10000);

const testFilenames = [
  '1.example.js',
  '2.example.js',
  '3.example.js',
  '4.example.js',
  '5.example.js',
  '6.example.js',
  '7.example.js',
  '8.example.js',
  '9.example.js',
  '10.example.js',
];

describe('Format', () => {
  for (const filename of testFilenames) {
    it(`${filename} - should have expected properties`, () => {

      const root = path.resolve(process.cwd(), 'test');
      const filepath = path.join(root, filename);
      const stdin = readFileSync(filepath).toString();
      const parsedJSONArray = collect(stdin, root, true, filepath, { line: 0, column: 0 });

      chaiExpect(parsedJSONArray).to.be.an('array');

      // Filter out the 'path' property because this changes between environments
      expect(
        parsedJSONArray.map(e => ({
          end: e.end,
          type: e.type,
          loc: { start: e.loc.start, end: e.loc.end },
          message: e.message,
          start: e.start
        }))
      ).toMatchSnapshot();

      for (const e of parsedJSONArray) {
        if (e !== false) {
          chaiExpect(e.type).to.be.a('string');
          chaiExpect(e.path)
            .to.be.a('string')
            .that.contains(path.join(process.cwd(), 'test'));
          chaiExpect(e.path)
            .to.be.a('string')
            .that.contains('.example.js');
        }
      }
    });
  }
});

const ESLINT_PATH = path.resolve('./node_modules/eslint/bin/eslint.js');

async function runEslint(cwd) {
  const result = await execa(ESLINT_PATH, ['**/*.{js,vue}', '--fix'], { cwd, stripEof: false });
  result.stdout = result.stdout && result.stdout.toString();
  result.stderr = result.stderr && result.stderr.toString();
  return result;
}

const codebases = [
  'column-offset',
  'coverage-fail',
  'coverage-fail2',
  'coverage-ok',
  'coverage-ok2',
  'coverage-sync-remove',
  'coverage-sync-update',
  'flow-pragma-1',
  'flow-pragma-2',
  'html-support',
  'libdefs',
  'no-flow-pragma',
  'project-1',
  'run-all',
  'run-all-flowdir',
  'warnings-all',
  'warnings-default',
  'warnings-mixed',
  'uncovered-example'
];

const eslintConfig = (enforceMinCoverage, updateCommentThreshold, checkUncovered, html) => `
  const Module = require('module');
  const path = require('path');
  const original = Module._resolveFilename;

  // Hack to allow eslint to find the plugins
  Module._resolveFilename = function(request, parent, isMain) {
    if (request === 'eslint-plugin-flowtype-errors') {
      return require.resolve('../../../');
    }
    if (request === 'eslint-plugin-html') {
      return require.resolve('../../../node_modules/eslint-plugin-html');
    }
    if (request === 'eslint-plugin-vue') {
      return require.resolve('../../../node_modules/eslint-plugin-vue');
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
    plugins: [${html ? `'html', 'vue',` : ''}'flowtype-errors'],
    settings: {
      'flowtype-errors': {
        stopOnExit: 'true'
      }
    },
    rules: {
      ${updateCommentThreshold
        ? [
          `'flowtype-errors/enforce-min-coverage': [2, ${enforceMinCoverage}],`,
          `'flowtype-errors/enforce-min-coverage-comments-sync': [2, ${enforceMinCoverage}, ${updateCommentThreshold}],`,
        ].join('\n')
        : enforceMinCoverage
          ? `'flowtype-errors/enforce-min-coverage': [2, ${enforceMinCoverage}],`
          : ``
        }
        ${checkUncovered ? `'flowtype-errors/uncovered': 2,` : ''}
        'flowtype-errors/show-errors': 2,
        'flowtype-errors/show-warnings': 1
    }
  };
`;

describe('Check codebases', () => {
  for (const codebase of codebases) {
    let folder;
    let title;

    if (Array.isArray(codebase)) {
      title = codebase[0];
      folder = codebase[1];
    } else {
      title = codebase;
      folder = codebase;
    }

     // eslint-disable-next-line no-loop-func
    it(`${title} - eslint should give expected output`, async() => {
      const fullFolder = path.resolve(`./test/codebases/${folder}`);
      const exampleJsFilePath = path.resolve(`./test/codebases/${folder}/example.js`);
      const exampleJsFixedFilePath = path.resolve(`./test/codebases/${folder}/example.fixed.js`);
      const hasFix = existsSync(exampleJsFixedFilePath)
      const configPath = path.resolve(fullFolder, '.eslintrc.js');

      const contentsBefore = hasFix && readFileSync(exampleJsFilePath)
      const contentsExpected = hasFix && readFileSync(exampleJsFixedFilePath)

      // Write config file
      writeFileSync(
        configPath,
        eslintConfig(
          folder.match(/^coverage-/) ? 50 : 0,
          folder.match(/^coverage-sync/) ? 10 : 0,
          !!folder.match(/^uncovered-/),
          /html-support/.test(folder)
        )
      );

      // Spawn a eslint process
      const { stdout, stderr } = await runEslint(fullFolder).catch(e => e);

      const regexp = new RegExp(
        `^${fullFolder.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')}.+\\.(js|vue)$`,
        'gm'
      ); // Escape regexp

      const contentsAfter = hasFix && readFileSync(exampleJsFilePath)

      // Revert the file to before it was fixed, since this file is checked into git.
      if (hasFix && contentsBefore !== contentsAfter) writeFileSync(exampleJsFilePath, contentsBefore)

      // Strip root from filenames
      expect(
        stdout.replace(regexp, match =>
          match.replace(fullFolder, '.').replace(/\\/g, '/')
        )
      ).toMatchSnapshot();

      expect(stderr).toEqual('');

      if (hasFix) {
        expect(contentsAfter).toEqual(contentsExpected);
      }

      // Clean up
      unlinkSync(configPath);
    });
  }
});
