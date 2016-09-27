const { execSync } = require('child_process');
const path = require('path');


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

module.exports = {
  rules: {
    'show-errors': function showErrors(context) {
      // We need to use exec sync here because ESLint doesn't support async plugins at the
      // moment 😭 That means we have to block the main thread every time we run collect errors
      // from Flow
      const collected = execSync(
        `node ${path.join(__dirname, './collect.js')}`
      );
      const parsedJSONArray = JSON.parse(collected);

      function collectFlowErrors(node) {
        if (Array.isArray(parsedJSONArray)) {
          try {
            const foundASTNodeError = parsedJSONArray
              .filter(each => each.path === context.getFilename())

              // ESLint uses a 'zero-based' column system. That means that they count columns
              // starting from 0. Weird... Flow's columns start at 1. Ughh
              .find(each =>
                each.start === node.loc.start.line &&
                each.loc.start.column === node.loc.start.column + 1
              );

            if (foundASTNodeError) {
              const { message, loc } = foundASTNodeError;

              return context.report({
                node,
                message,
                loc
              });
            }
          } catch (err) {
            console.log(err);
          }
        }
      }

      /**
       * HACK: We need to find a proper way of running ESLint on every line
       */
      return {
        ArrayExpression: collectFlowErrors,
        ArrayPattern: collectFlowErrors,
        ArrowFunctionExpression: collectFlowErrors,
        AssignmentExpression: collectFlowErrors,
        AssignmentPattern: collectFlowErrors,
        BinaryExpression: collectFlowErrors,
        BlockStatement: collectFlowErrors,
        BreakStatement: collectFlowErrors,
        CallExpression: collectFlowErrors,
        CatchClause: collectFlowErrors,
        Class: collectFlowErrors,
        ClassBody: collectFlowErrors,
        ClassDeclaration: collectFlowErrors,
        ClassExpression: collectFlowErrors,
        ConditionalStatement: collectFlowErrors,
        ContinueStatement: collectFlowErrors,
        DebuggerStatement: collectFlowErrors,
        Declaration: collectFlowErrors,
        DoWhileStatement: collectFlowErrors,
        EmptyExpression: collectFlowErrors,
        EmptyStatement: collectFlowErrors,
        ExportAllDeclaration: collectFlowErrors,
        ExportDeclaration: collectFlowErrors,
        ExportDefaultDeclaration: collectFlowErrors,
        ExportNamedDeclaration: collectFlowErrors,
        ExportSpecifier: collectFlowErrors,
        Expression: collectFlowErrors,
        ExpressionStatement: collectFlowErrors,
        ForInStatement: collectFlowErrors,
        ForOfStatement: collectFlowErrors,
        ForStatement: collectFlowErrors,
        Function: collectFlowErrors,
        FunctionDeclaration: collectFlowErrors,
        FunctionExpression: collectFlowErrors,
        Identifier: collectFlowErrors,
        IfStatement: collectFlowErrors,
        ImportDeclaration: collectFlowErrors,
        ImportDefaultSpecifier: collectFlowErrors,
        ImportNamespaceSpecifier: collectFlowErrors,
        ImportSpecifier: collectFlowErrors,
        LabeledStatement: collectFlowErrors,
        Literal: collectFlowErrors,
        LogicalExpression: collectFlowErrors,
        MemberExpression: collectFlowErrors,
        MetaProperty: collectFlowErrors,
        MethodDefinition: collectFlowErrors,
        NewExpression: collectFlowErrors,
        Node: collectFlowErrors,
        ObjectExpression: collectFlowErrors,
        ObjectPattern: collectFlowErrors,
        Pattern: collectFlowErrors,
        Position: collectFlowErrors,
        Program: collectFlowErrors,
        Property: collectFlowErrors,
        Regex: collectFlowErrors,
        RestElement: collectFlowErrors,
        ReturnStatement: collectFlowErrors,
        SequenceExpression: collectFlowErrors,
        SourceLocation: collectFlowErrors,
        SpreadElement: collectFlowErrors,
        Statement: collectFlowErrors,
        Super: collectFlowErrors,
        SwitchCase: collectFlowErrors,
        SwitchStatement: collectFlowErrors,
        TaggedTemplateExpression: collectFlowErrors,
        TemplateElement: collectFlowErrors,
        TemplateLiteral: collectFlowErrors,
        ThisExpression: collectFlowErrors,
        ThrowStatement: collectFlowErrors,
        Tools: collectFlowErrors,
        TryStatement: collectFlowErrors,
        UnaryExpression: collectFlowErrors,
        UpdateExpression: collectFlowErrors,
        VariableDeclaration: collectFlowErrors,
        VariableDeclarator: collectFlowErrors,
        WhileStatement: collectFlowErrors,
        WithStatement: collectFlowErrors,
        YieldExpression: collectFlowErrors
      };
    }
  }
};
