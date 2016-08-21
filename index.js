const execSync = require('child_process').execSync;


module.exports = {
  rules: {
    "show-errors": function(context) {

      const collected = execSync('node ./node_modules/eslint-plugin-flowtype-errors/collect.js');

      // Buffer to string
      const loo = collected.toString();
      const lee = JSON.parse(collected);

      function collectFlowErrors(node) {

        try {
          const found = lee.find(each => {
            return (
              each.start === node.loc.start.line &&
              each.path === context.getFilename()
            )
          });

          if (found) {
            return context.report(node, found.message);
          }
        } catch (err) {
          console.log(err);
        }
      }

      return {
        Program: collectFlowErrors,
        ClassBody: collectFlowErrors,
        BlockStatement: collectFlowErrors,
        WhileStatement: collectFlowErrors,
        ForStatement: collectFlowErrors,
        ForInStatement: collectFlowErrors,
        ForOfStatement: collectFlowErrors,
        DoWhileStatement: collectFlowErrors,
        IfStatement: collectFlowErrors,
        VariableDeclaration: collectFlowErrors,
        ObjectExpression: collectFlowErrors,
        ArrayExpression: collectFlowErrors,
        MemberExpression: collectFlowErrors,
        SwitchStatement: collectFlowErrors,
        SwitchCase: collectFlowErrors
      };
	  }
  },
};
