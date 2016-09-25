const { execSync } = require('child_process');
const { type } = require('os');
const path = require('path');
const osType = type();


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
//       const collected = execSync('node ./node_modules/eslint-plugin-flowtype-errors/collect.js');
//       const loo = collected.toString();
//       const parsedJSON = JSON.parse(collected);
//       lru.set('cache', parsedJSON);
//       return parsedJSON;
//     default:
//       return lru('cache')
//   }
// })();

module.exports = {
  rules: {
    'show-errors': function showErrors(context) {
      const collected = execSync(
        `node ${path.normalize('./node_modules/eslint-plugin-flowtype-errors/dist/collect.js')}`
      );
      const parsedJSON = JSON.parse(collected);

      function collectFlowErrors(node) {
        if (Array.isArray(parsedJSON) && osType !== 'Windows_NT') {
          try {
            const found = parsedJSON.find(each => (
              each.start === node.loc.start.line &&
              each.path === context.getFilename()
            ));

            if (found) {
              return context.report(node, found.message);
            }
          } catch (err) {
            console.log(err);
          }
        }
      }

      return {
        Program: collectFlowErrors,
        ClassBody: collectFlowErrors,
        BlockStatement: collectFlowErrors,
        WhileStatement: collectFlowErrors,
        ForStatement: collectFlowErrors,
        ExpressionStatement: collectFlowErrors,
        ForInStatement: collectFlowErrors,
        ForOfStatement: collectFlowErrors,
        DoWhileStatement: collectFlowErrors,
        IfStatement: collectFlowErrors,
        Identifier: collectFlowErrors,
        FunctionDeclaration: collectFlowErrors,
        VariableDeclaration: collectFlowErrors,
        ObjectExpression: collectFlowErrors,
        ArrayExpression: collectFlowErrors,
        MemberExpression: collectFlowErrors,
        SwitchStatement: collectFlowErrors,
        SwitchCase: collectFlowErrors
      };
    }
  }
};
