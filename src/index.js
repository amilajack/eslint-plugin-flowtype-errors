import path from 'path';
import fs from 'fs';
import collect, { coverage } from './collect';


let runOnAllFiles;

function hasFlowPragma(source) {
  return source
    .getAllComments()
    .some(comment => /@flow/.test(comment.value));
}

function lookupFlowDir(context) {
  const root = process.cwd();
  const flowDirSetting = context.settings
    && context.settings['flowtype-errors']
    && context.settings['flowtype-errors'].flowDir || '.';

  return fs.existsSync(path.join(root, flowDirSetting, '.flowconfig'))
    ? path.join(root, flowDirSetting)
    : root;
}

function stopOnExit(context) {
  return !!(context.settings && context.settings.stopOnExit);
}

export default {
  rules: {
    'enforce-min-coverage': function enforceMinCoverage(context) {
      return {
        Program() {
          const source = context.getSourceCode();
          const flowDir = lookupFlowDir(context);
          const requiredCoverage = context.options[0];

          if (hasFlowPragma(source)) {
            const res = coverage(source.getText(), flowDir, context.getFilename());

            if (res === true) {
              return;
            }

            const { coveredCount, uncoveredCount } = res;

            /* eslint prefer-template: 0 */
            const percentage = Number(Math.round((coveredCount / (coveredCount + uncoveredCount)) * 100 + 'e2') + 'e-2');

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
    'show-errors': function showErrors(context) {
      return {
        Program() {
          const onTheFly = true;
          let collected;

          if (onTheFly) {
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

            collected = collect(
              source.getText(), flowDir, stopOnExit(context), context.getFilename()
            );
          } else {
            collected = collect();
          }

          const pluginErrors = Array.isArray(collected)
            ? (onTheFly ? collected : collected.filter(
                each => each.path === context.getFilename()
              ))
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
