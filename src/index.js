import path from 'path';
import collect from './collect';


export default {
  rules: {
    'show-errors': function showErrors(context) {
      return {
        Program() {
          // const onTheFly = false;
          const onTheFly = true;
          let collected;

          if (onTheFly) {
            const stdin = context.getSourceCode().getText();
            const root = path.join(process.cwd());
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
