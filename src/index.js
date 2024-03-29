/* @flow */

import path from 'path';
import fs from 'fs';
// $FlowIgnore
import findUp from 'find-up';
import recommended from './config/recommended';
import {
  type CollectOutputElement,
  FlowSeverity,
  collect,
  coverage,
} from './collect';
import getProgram, { type Program, type Loc } from './get-program';

type EslintContext = {
  getAllComments: () => { value: string }[],
  getFilename: () => string,
  getSourceCode: () => Object,
  report: ({ loc: Loc, message: string }) => void,
  settings: ?{
    'flowtype-errors': ?{
      stopOnExit?: any,
    },
  },
  options: any[],
};

type ReturnRule = { Program: (node: Object) => void }

type Info = {
  flowDir: string,
  program: Program,
};

const DEFAULT_LOC = {
  start: {
    line: 1,
    column: 0,
  },
  end: {
    line: 1,
    column: 0,
  },
};

function lookupInfo(
  context: EslintContext,
  source: Object,
  node: Object
): ?Info {
  const flowconfigFile = findUp.sync('.flowconfig', {
    cwd: path.dirname(context.getFilename()),
  });

  if (flowconfigFile == null) {
    const program = getProgram(source, node);
    context.report({
      loc: program ? program.loc : DEFAULT_LOC,
      message: "Could not find '.flowconfig' file",
    });
    return null;
  }

  const flowDir = path.dirname(flowconfigFile);

  const runOnAllFiles = fs
    .readFileSync(flowconfigFile, 'utf8')
    .includes('all=true');

  const shouldRun =
    runOnAllFiles ||
    source.getAllComments().some((comment) => /@flow/.test(comment.value));

  const program = shouldRun && getProgram(source, node);

  if (program) {
    return {
      flowDir,
      program,
    };
  }

  return null;
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
    message: `Flow could not be run. Possible causes include:
  * Running on 32-bit OS (https://github.com/facebook/flow/issues/2262)
  * Recent glibc version not available (https://github.com/flowtype/flow-bin/issues/49)
  * FLOW_BIN environment variable ${
    process.env.FLOW_BIN ? 'set incorrectly' : 'not set'
  }
.`,
  };
}

function createFilteredErrorRule(filter: (CollectOutputElement) => any): (context: EslintContext) => ReturnRule {
  return function showErrors(context: EslintContext): ReturnRule {
    return {
      Program(node: Object) {
        const source = context.getSourceCode();
        const info = lookupInfo(context, source, node);

        if (!info) {
          return;
        }

        const { flowDir, program } = info;

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
                    column: loc.start.column - 1,
                  },
                }
              : loc,
            message,
          });
        });
      },
    };
  };
}

const MIN_COVERAGE_DIRECTIVE_COMMENT_PATTERN =
  /(\s*eslint\s*['"]flowtype-errors\/enforce-min-coverage['"]\s*:\s*\[\s*(?:2|['"]error['"])\s*,\s*)(\d+)(\]\s*)/

function getMinCoverageDirectiveCommentNodeAndPercent(sourceCode) {
  let commentNode
  let minPercent
  // eslint-disable-next-line no-restricted-syntax
  for (const comment of sourceCode.getAllComments()) {
    const match = comment.value.match(MIN_COVERAGE_DIRECTIVE_COMMENT_PATTERN)
    if (match && match[2]) {
      commentNode = comment
      minPercent = parseInt(match[2], 10)
      break
    }
  }
  return [commentNode, minPercent]
}

const getCoverage = (context, node) => {
  const source = context.getSourceCode();
  const info = lookupInfo(context, source, node);

  if (!info) {
    return;
  }

  const { flowDir, program } = info;

  const coverageInfo = coverage(
    program.text,
    flowDir,
    stopOnExit(context),
    context.getFilename()
  );

  if (coverageInfo === true) {
    return;
  }

  if (coverageInfo === false) {
    context.report(errorFlowCouldNotRun(program.loc));
    return;
  }

  return { program, coverageInfo };
};

export default {
  configs: {
    recommended,
  },
  rules: {
    uncovered: function showCoverage(context: EslintContext): ReturnRule {
      return {
        Program(node: Object) {
          const res = getCoverage(context, node);
          if (!res) {
            return;
          }

          res.coverageInfo.uncoveredLocs.forEach((loc) => {
            context.report({
              loc: {
                start: {
                  line: loc.start.line,
                  // Flow's and eslint's column reporting don't agree
                  column: loc.start.column - 1,
                },
                end: loc.end,
              },
              message: `Uncovered expression! Try adding annotations to inform flow of the type.`,
            });
          });
        },
      };
    },
    'enforce-min-coverage': function enforceMinCoverage(
      context: EslintContext
    ): ReturnRule {
      return {
        Program(node: Object) {
          const res = getCoverage(context, node);
          if (!res) {
            return;
          }

          const requiredCoverage = context.options[0];
          const { coveredCount, uncoveredCount } = res.coverageInfo;

          /* eslint prefer-template: 0 */
          const percentage = Number(
            Math.round(
              (coveredCount / (coveredCount + uncoveredCount)) * 10000
            ) + 'e-2'
          );

          if (percentage < requiredCoverage) {
            context.report({
              loc: res.program.loc,
              message: `Expected coverage to be at least ${requiredCoverage}%, but is: ${percentage}%`,
            });
          }
        },
      };
    },
    'enforce-min-coverage-comments-sync': {
      meta: {
        fixable: 'code',
      },
      create: function enforceMinCoverageCommentsSync(
        context: EslintContext
      ): ReturnRule {
        return {
          Program(node: Object) {
            const res = getCoverage(context, node);
            if (!res) {
              return;
            }

            const sourceCode = context.getSourceCode()
            const [minCoverageDirectiveCommentNode, requiredCoverage] = getMinCoverageDirectiveCommentNodeAndPercent(sourceCode)
              if (!minCoverageDirectiveCommentNode || !requiredCoverage) {
              return;
            }

            // Get global requiredCoverage outside the inline module comment.
            const enforceMinCoverage = context.options[0];
            // If flow coverage is >=updateCommentThreshold% greater than allowed, update the eslint comment.
            const updateCommentThreshold = context.options[1];
            const { coveredCount, uncoveredCount } = res.coverageInfo;

            /* eslint prefer-template: 0 */
            const percentage = Number(
              Math.round(
                (coveredCount / (coveredCount + uncoveredCount)) * 10000
              ) + 'e-2'
            );

            if (percentage - requiredCoverage > updateCommentThreshold) {
              context.report({
                loc: res.program.loc,
                message: `Expected coverage comment to be within ${updateCommentThreshold}% of ${requiredCoverage}%, but is: ${percentage}%`,
                fix(fixer) {
                  if (percentage >= enforceMinCoverage) {
                    // If coverage >= global required amount, remove comment entirely.
                    return fixer.replaceText(minCoverageDirectiveCommentNode, '')
                  }

                  return fixer.replaceText(minCoverageDirectiveCommentNode, minCoverageDirectiveCommentNode.value.replace(MIN_COVERAGE_DIRECTIVE_COMMENT_PATTERN, `/*$1${Math.floor(percentage)}$3*/`))
                }
              });
            }
          },
        };
      },
    },
    'show-errors': (createFilteredErrorRule(
      ({ level }) => level !== FlowSeverity.Warning
    ) : (context: EslintContext) => ReturnRule),
    'show-warnings': (createFilteredErrorRule(
      ({ level }) => level === FlowSeverity.Warning
    ) : (context: EslintContext) => ReturnRule),
  },
};
