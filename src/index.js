/* @flow */

import path from 'path';
import fs from 'fs';
import {
  type CollectOutputElement,
  FlowSeverity,
  collect,
  coverage
} from './collect';
import getProgram from './get-program';

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

function stopOnExit(context: EslintContext): boolean {
  return !!(
    context.settings &&
    context.settings['flowtype-errors'] &&
    context.settings['flowtype-errors'].stopOnExit
  );
}

function errorFlowCouldNotRun(loc) {
  return {
    loc,
    message:
`Flow could not be run. Possible causes include:
  * Running on 32-bit OS (https://github.com/facebook/flow/issues/2262)
  * Recent glibc version not available (https://github.com/flowtype/flow-bin/issues/49)
  * FLOW_BIN environment variable ${process.env.FLOW_BIN ? 'set incorrectly' : 'not set'}
.`
  };
}

function createFilteredErrorRule(filter: (CollectOutputElement) => any) {
  return function showErrors(context: EslintContext) {
    return {
      Program(node: Object) {
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
          return;
        }

        const program = getProgram(source, node);
        if ( !program ) {
          return;
        }

        const collected = collect(
          program.text,
          flowDir,
          stopOnExit(context),
          context.getFilename(),
          program.offset
        );

        if (collected === true) {
          return;
        }

        if (collected === false) {
          context.report(errorFlowCouldNotRun(program.loc));
          return;
        }

        collected.filter(filter).forEach(({ loc, message }) => {
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
  };
}

export default {
  rules: {
    'enforce-min-coverage': function enforceMinCoverage(
      context: EslintContext
    ) {
      return {
        Program(node: Object) {
          const source = context.getSourceCode();

          if (hasFlowPragma(source)) {
            const program = getProgram(source, node);
            if ( !program ) {
              return;
            }

            const res = coverage(
              program.text,
              lookupFlowDir(context),
              stopOnExit(context),
              context.getFilename()
            );

            if (res === true) {
              return;
            }

            if (res === false) {
              context.report(errorFlowCouldNotRun(program.loc));
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
                loc: program.loc,
                message: `Expected coverage to be at least ${requiredCoverage}%, but is: ${percentage}%`
              });
            }
          }
        }
      };
    },
    'show-errors': createFilteredErrorRule(({ level }) => level !== FlowSeverity.Warning),
    'show-warnings': createFilteredErrorRule(({ level }) => level === FlowSeverity.Warning)
  }
};
