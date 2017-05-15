/* @flow */

import path from 'path';
import fs from 'fs';
import collect, { coverage } from './collect';

type EslintContext = {
  getAllComments: Function,
  getFilename: Function,
  getSourceCode: Function,
  report: Function,
  settings: ?{
    "flowtype-errors": ?{
      flowDir: ?string
    },
    stopOnExit: ?any
  },
  options: any[]
}

let runOnAllFiles;

function hasFlowPragma(source) {
  return source
    .getAllComments()
    .some(comment => /@flow/.test(comment.value));
}

function lookupFlowDir(context: EslintContext): string {
  const root = process.cwd();
  const flowDirSetting: string = context.settings
    && context.settings['flowtype-errors']
    && context.settings['flowtype-errors'].flowDir || '.';

  return fs.existsSync(path.join(root, flowDirSetting, '.flowconfig'))
    ? path.join(root, flowDirSetting)
    : root;
}

function stopOnExit(context: EslintContext): boolean {
  return !!(context.settings && context.settings.stopOnExit);
}

export default {
  rules: {
    'enforce-min-coverage': function enforceMinCoverage(context: EslintContext) {
      return {
        Program() {
          const source = context.getSourceCode();
          const flowDir = lookupFlowDir(context);
          const requiredCoverage = context.options[0];

          if (hasFlowPragma(source)) {
            const res = coverage(
              source.getText(), flowDir, stopOnExit(context), context.getFilename()
            );

            if (res === true) {
              return;
            }

            const { coveredCount, uncoveredCount } = res;

            /* eslint prefer-template: 0 */
            const percentage = Number(Math.round((coveredCount / (coveredCount + uncoveredCount)) * 10000) + 'e-2');

            if (percentage < requiredCoverage) {
              context.report({
                loc: 1,
                message: `Expected coverage to be at least ${requiredCoverage}%, but is: ${percentage}%`
              });
            }
          }
        }
      };
    },
    'show-errors': function showErrors(context: EslintContext) {
      return {
        Program() {
          const source = context.getSourceCode();
          const flowDir = lookupFlowDir(context);

          // Check to see if we should run on every file
          if (runOnAllFiles === undefined) {
            try {
              runOnAllFiles = fs
                .readFileSync(path.join(flowDir, '.flowconfig'))
                .toString()
                .includes('all=true');
            } catch (err) {
              runOnAllFiles = false;
            }
          }

          if (runOnAllFiles === false && !hasFlowPragma(source)) {
            return true;
          }

          const collected = collect(
            source.getText(), flowDir, stopOnExit(context), context.getFilename()
          );

          const pluginErrors = Array.isArray(collected)
            ? collected
            : [];

          pluginErrors.forEach(({ loc, message }) => {
            context.report({
              loc,
              message
            });
          });
        }
      };
    }
  }
};
