import path from 'path';
import fs from 'fs';
import collect from './collect';


let runOnAllFiles;

function hasFlowPragma(source) {
  let has = false;
  const comments = source.getAllComments();

  for (let i = 0; i < comments.length; i += 1) {
    if (/@flow/.test(comments[i].value)) {
      has = true;
      break;
    }
  }

  return has;
}

export default {
  rules: {
    'show-errors': function showErrors(context) {
      return {
        Program() {
          const onTheFly = true;
          let collected;

          if (onTheFly) {
            const source = context.getSourceCode();
            const root = process.cwd();

            // Check to see if we should run on every file
            if (runOnAllFiles === undefined) {
              try {
                runOnAllFiles = fs
                  .readFileSync(path.join(root, '.flowconfig'))
                  .toString()
                  .includes('all=true');
              } catch (err) {
                runOnAllFiles = false;
              }
            }

            if (runOnAllFiles === false && !hasFlowPragma(source)) {
              return true;
            }

            collected = collect(source.getText(), root, context.getFilename());
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
