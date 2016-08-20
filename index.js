const Collect = require('./collect')
const collected = Collect()


module.exports = {
  rules: {
    "show-errors": function(context) {

      function collectFlowErrors(node) {
        return collected.catch(res => {
          const found = res.find(res => res.start === node.loc.start.line);

          if (found) {
            // console.log(found);
            return context.report(node, found.message);
          }

          return context.report(node, found.message);
        });
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
