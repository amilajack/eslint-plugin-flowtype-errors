import path from 'path';
import fs from 'fs';
import collect from './collect';


let runOnAllFiles;

export default {
  rules: {
    'show-errors': function showErrors(context) {
      return {
        Program() {
          const onTheFly = true;
          let collected;

          if (onTheFly) {
            const stdin = context.getSourceCode().getText();
            const root = process.cwd();

            // Check to see if we should run on every file
            if (runOnAllFiles === undefined) {
              runOnAllFiles = fs
                .readFileSync(path.join(root, '.flowconfig'))
                .toString()
                .includes('all=true');
            }

            if (stdin) {
              if (runOnAllFiles === false) {
                // `String.prototype.includes` is an O(n) operation :(
                if (!stdin.includes('@flow')) {
                  return true;
                }
              }
            }

            collected = collect(stdin, root, context.getFilename());
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
