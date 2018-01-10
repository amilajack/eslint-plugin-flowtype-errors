/* @flow */

export type EslintContext = {
  getAllComments: Function,
  getFilename: Function,
  getSourceCode: Function,
  report: Function,
  settings: ?{
    'flowtype-errors': ?{
      flowDir?: string,
      stopOnExit?: any
    }
  },
  options: any[]
};
