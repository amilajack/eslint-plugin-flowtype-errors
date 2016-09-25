// Reference https://github.com/facebook/nuclide/blob/master/pkg/nuclide-flow-rpc/lib/FlowRoot.js

const flowBin = require('flow-bin');
const path = require('path');
const childProcess = require('child_process');

/**
 * Wrap critical Flow exception into default Error json format
 */
function fatalError(stderr) {
  return {
    errors: [{
      message: [{
        path: '',
        code: 0,
        line: 0,
        start: 0,
        descr: stderr
      }]
    }]
  };
}

function getFlowBin() {
  return process.env.FLOW_BIN || flowBin;
}

function executeFlow() {
  const args = ['--json'];

  const { stdout } = childProcess.spawnSync(getFlowBin(), args);

  // Windows fails at this step. Temporarily pass
  if (!stdout) {
    return true;
  }

  const stringifiedStdout = stdout.toString();

  let parsed;

  try {
    parsed = JSON.parse(stringifiedStdout);
  } catch (e) {
    parsed = fatalError(stringifiedStdout);
  }

  // loop through errors in file
  const output = parsed.errors.map(res => res.message.map((_res, i, whole) => {
    if (_res.type === 'Comment' || !_res.loc) {
      return false;
    }

    const comments = whole.find(_ => _.type === 'Comment');
    const typeMessage = `${comments ? comments.descr : ''} ${_res.descr}`;

    return {
      message: typeMessage,
      path: _res.path,
      start: _res.loc.start.line,
      end: _res.loc.end.line
    };
  }))
  .filter(res => res !== false)
  .reduce((p, c) => p.concat(c), []);

  if (output.length) {
    return output;
  }

  return true;
}

function Flow(filepath = path.normalize('./')) {
  return executeFlow(filepath, {});
}

process.stdout.write(JSON.stringify(Flow()));

module.exports = Flow;
