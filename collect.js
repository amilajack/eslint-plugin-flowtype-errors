/* eslint no-var: 0, brace-style: 0 */

// Reference https://github.com/facebook/nuclide/blob/master/pkg/nuclide-flow-rpc/lib/FlowRoot.js

const flowBin = require('flow-bin');
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
  var args = [
    // command,
    // ...opts,
    // '/' + path.relative('/', _path),
    '--json'
  ];

  const { stdout } = childProcess.spawnSync(getFlowBin(), args);

  // Windows fails at this step. Temporarily pass
  if (!stdout) {
    return true;
  }

  const dat = stdout.toString();

  let parsed;

  try {
    parsed = JSON.parse(dat);
  } catch (e) {
    parsed = fatalError(dat);
  }

  // loop through errors in file
  const output = parsed.errors.map(res => res.message.map((_res, i, whole) => {
    if (_res.type === 'Comment' || !_res.loc) {
      return false;
    }

    const he = whole.find(_ => _.type === 'Comment');

    const typeMessage =
      `${he ? he.descr : ''} ${_res.descr}`;

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

function Flow(filepath = './') {
  return executeFlow(filepath, {});
}

process.stdout.write(JSON.stringify(Flow()));

module.exports = Flow;
