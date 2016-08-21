const execSync = require('child_process').execSync;

// @TODO: Currently, flow runs all its checks for each file. That means that
//        O(n) = n^2, where a is the number of files flow has to check. A
//        possible optimization is watching the source files to check if
//        any file has changed. If a file did change, run flow and cache


module.exports = {
  rules: {
    "show-errors": function(context) {

      const collected = execSync('node ./node_modules/eslint-plugin-flowtype-errors/collect.js');

      // Buffer to string
      const loo = collected.toString();
      const lee = JSON.parse(collected);


      function collectFlowErrors(node) {

        if (Array.isArray(lee)) {
          try {
            const found = lee.find(each => {

              if (each.path === context.getFilename()) {
                console.log(each.path === context.getFilename());
                console.log(each.start, node.loc.start.line);
                console.log(context.getFilename());
              }
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
      }

      // @TODO: Get all the AST node types of the flow errors and only check those

      return {
        Program: collectFlowErrors,
        ClassBody: collectFlowErrors,
        BlockStatement: collectFlowErrors,
        WhileStatement: collectFlowErrors,
        ForStatement: collectFlowErrors,
        BlockStatement: collectFlowErrors,
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
  },
};
