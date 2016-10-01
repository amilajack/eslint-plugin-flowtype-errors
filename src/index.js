import { execSync } from 'child_process';
import path from 'path';


//
// @NOTE: "show-errors" runs on each file. collectFlowErrors runs on each AST node
//
// @TODO: With the current implementation, flow checks every file each time
//        "show-errors" runs. That means that the entire cost of running this
//        plugin is O(n) = n^2, where a is the number of files flow has to
//        check. A possible optimization is watching the source files to check
//        if any file has changed. If a file did change, run flow and cache
//
//        This could be reduced to O(n) = 1 by running watching the source files
//        and only re-running any time a file has changed
//
// @NOTE: Concept
//
// const collected = (() => {
//   switch (hasChanged()) {
//     case true:
//       const collectedErrors = execSync(
//        'node ./node_modules/eslint-plugin-flowtype-errors/collect.js'
//       );
//       const stringifiedStdout = collectedErrors.toString();
//       const parsedJSONArray = JSON.parse(collectedErrors);
//       lru.set('cache', parsedJSONArray);
//       return parsedJSONArray;
//     default:
//       return lru('cache')
//   }
// })();
//

module.exports = {
  rules: {
    'show-errors': function showErrors(context) {
      return {
        Program() {
          const collected = execSync(
            `node ${path.join(__dirname, './collect.js')}`
          );
          const parsedJSONArray = JSON.parse(collected);

          const pluginErrors = collectFlowErrors();
          const { loc, message } = pluginErrors[0];
          //
          // context.report({
          //   loc,
          //   message
          // });

          // context.report({
          //   loc: {
          //     start: {
          //       line: loc.start.line
          //       // line: Math.round(Math.random(10) * 100)
          //     }
          //   },
          //   message
          // });

          context.report({
            loc: {
              start: {
                line: loc.start.line
                // line: Math.round(Math.random(10) * 100)
              }
            },
            message: 'foo' + loc.start.line + Math.round(Math.random(10) * 100)
          });

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

          // const pluginErrors = collectFlowErrors();
          // pluginErrors.forEach(({ loc, message }) => {
          //   context.report({
          //     loc: {
          //       start: {
          //         line: loc.start.line,
          //         column: loc.start.column
          //       },
          //       end: {
          //         line: loc.end.line,
          //         column: loc.end.column
          //       }
          //     },
          //     message
          //   });
          // });
        }
      };
    }
  }
};
