import path from 'path';
import fs from 'fs';
import collect from './collect';


let runOnAllFiles;

function hasFlowPragma(source) {
  return source
    .getAllComments()
    .some(comment => /@flow/.test(comment.value));
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
            const flowDirSetting = context.settings
              && context.settings['flowtype-errors']
              && context.settings['flowtype-errors']['flowDir'];

            const flowDir = fs.existsSync(path.join(root, flowDirSetting, '.flowconfig'))
              ? path.join(root, flowDirSetting)
              : root

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

            collected = collect(source.getText(), flowDir, context.getFilename());
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
