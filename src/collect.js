/**
 * Run Flow and collect errors in JSON format
 * Reference https://github.com/facebook/nuclide/blob/master/pkg/nuclide-flow-rpc/lib/FlowRoot.js
 */
import flowBin from 'flow-bin';
import path from 'path';
import childProcess from 'child_process';
import filter from './filter';


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

  //
  // This serves as a temporary HACK to prevent 32 bit OS's from failing. Flow does not
  // support 32 bit OS's at the moment.
  // This pretends as if there are now flow errors
  //
  // Ideally, there would be a preinstall npm event to check if the user is on a 32 bit OS
  //

  if (!stdout) {
    return true;
  }

  const stringifiedStdout = stdout.toString();
  let parsedJSONArray;

  try {
    parsedJSONArray = JSON.parse(stringifiedStdout);
  } catch (e) {
    parsedJSONArray = fatalError(stringifiedStdout);
  }

  // Loop through errors in the file
  const output = parsedJSONArray.errors.map(error => error.message.map((message, i, whole) => {
    if (message.type === 'Comment' || !message.loc) {
      return false;
    }

    const comments = whole.find(_ => _.type === 'Comment');
    const messageDescr = `${comments ? comments.descr : ''} ${message.descr}`;

    if (process.env.DEBUG_FLOWTYPE_ERRRORS === 'true') {
      return {
        message: messageDescr,
        path: message.path,
        start: message.loc.start.line,
        end: message.loc.end.line,
        parsedJSONArray
      };
    }

    return {
      message: messageDescr,
      path: message.path,
      start: message.loc.start.line,
      end: message.loc.end.line
    };
  }))
  .reduce((p, c) => p.concat(c), []);

  return output.length
    ? filter(output)
    : true;
}

function Flow(filepath = './') {
  return executeFlow(path.normalize(filepath), {});
}

process.stdout.write(JSON.stringify(Flow()));

module.exports = Flow;
