var Module = require('module');
var path = require('path');
var original = Module._resolveFilename;

// Hack to allow eslint to find the plugin
Module._resolveFilename = function(request, parent, isMain) {
  if (request === 'eslint-plugin-flowtype-errors') {
    return path.resolve('../../../dist/index.js');
  }
  return original.call(this, request, parent, isMain);
};

module.exports = {
  parser: 'babel-eslint',
  root: true, // Make ESLint ignore configuration files in parent folders
  env: {
    node: true,
    es6: true
  },
  plugins: ['flowtype-errors'],
  rules: {
    'flowtype-errors/show-errors': 2
  }
};
