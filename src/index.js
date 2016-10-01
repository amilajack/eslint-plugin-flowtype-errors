import { execSync } from 'child_process';
import path from 'path';


export default {
  rules: {
    'show-errors': function showErrors(context) {
      return {
        Program() {
          const collected = execSync(
            `node ${path.join(__dirname, './collect.js')}`
          );
          const parsedJSONArray = JSON.parse(collected);

          function collectFlowErrors() {
            try {
              return parsedJSONArray.filter(
                each => each.path === context.getFilename()
              );
            } catch (err) {
              console.log(err);
              return [];
            }
          }

          const pluginErrors = collectFlowErrors();

          pluginErrors.forEach(({ loc, message }) => {
            context.report({
              loc: {
                start: {
                  line: loc.start.line
                }
              },
              message
            });
          });
        }
      };
    }
  }
};
