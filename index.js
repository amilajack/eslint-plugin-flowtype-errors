"use strict";

console.log(node);

module.exports = {
  rules: {
    "fat-cow": function(context) {
	    return {
        "VariableDeclaration": function(node) {
          if (node.kind === "let") {
            console.log(node);
            context.report(node, "Unexpected let, use const.");
          }
        }
	    };
	  }
  },
	configs: {
		recommended: {
    	rules: {
      	'redux/no-let': 2,
      	'redux/no-this': 2,
      	'redux/no-mutation': 2
    	}
    }
	}
};
