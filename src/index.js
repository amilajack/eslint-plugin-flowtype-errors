/* @flow */

import path from 'path';
import fs from 'fs';
import { collect, coverage } from './collect';

type EslintContext = {
  getAllComments: Function,
  getFilename: Function,
  getSourceCode: Function,
  report: Function,
  settings: ?{
    'flowtype-errors': ?{
      flowDir?: string,
      stopOnExit?: any
    }
  },
  options: any[]
};

let runOnAllFiles;

function hasFlowPragma(source) {
  return source.getAllComments().some(comment => /@flow/.test(comment.value));
}

function lookupFlowDir(context: EslintContext): string {
  const root = process.cwd();
  const flowDirSetting: string =
    (context.settings &&
      context.settings['flowtype-errors'] &&
      context.settings['flowtype-errors'].flowDir) ||
    '.';

  return fs.existsSync(path.join(root, flowDirSetting, '.flowconfig'))
    ? path.join(root, flowDirSetting)
    : root;
}

function stopOnExit(context: EslintContext): bool {
  return !!(
    context.settings &&
    context.settings['flowtype-errors'] &&
    context.settings['flowtype-errors'].stopOnExit
  );
}

function error32bit() {
  return {
    loc: 1,
    message: "Flow does not support 32 bit OS's at the moment."
  };
}

export default {
  rules: {
    'enforce-min-coverage': function enforceMinCoverage(
      context: EslintContext
    ) {
      return {
        Program() {
          const source = context.getSourceCode();

          if (hasFlowPragma(source)) {
            const res = coverage(
              source.getText(),
              lookupFlowDir(context),
              stopOnExit(context),
              context.getFilename()
            );

            if (res === true) {
              return;
            }

            if (res === false) {
              context.report(error32bit());
              return;
            }

            const requiredCoverage = context.options[0];
            const { coveredCount, uncoveredCount } = res;

            /* eslint prefer-template: 0 */
            const percentage = Number(
              Math.round(
                coveredCount / (coveredCount + uncoveredCount) * 10000
              ) + 'e-2'
            );

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
            source.getText(),
            flowDir,
            stopOnExit(context),
            context.getFilename()
          );

          if (collected === true) {
            return;
          }

          if (collected === false) {
            context.report(error32bit());
            return;
          }

          collected.forEach(({ loc, message }) => {
            context.report({
              loc: loc
                ? {
                    ...loc,
                    start: {
                      ...loc.start,
                      // Flow's column numbers are 1-based, while ESLint's are 0-based.
                      column: loc.start.column - 1
                    }
                  }
                : loc,
              message
            });
          });
        }
      };
    }
  }
};
