/**
 * Run Flow and collect errors in JSON format
 *
 * Reference the following links for possible bug fixes and optimizations
 * https://github.com/facebook/nuclide/blob/master/pkg/nuclide-flow-rpc/lib/FlowRoot.js
 * https://github.com/ptmt/tryflow/blob/gh-pages/js/worker.js
 */
import flowBin from 'flow-bin';
import fs from 'fs';
import childProcess from 'child_process';
import filter from './filter';
require('shelljs/global');


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

function executeFlow(stdin, root, filepath) {
  let stdout;

  switch (stdin && root && filepath && stdin !== '') {
    case true:
      fs.writeFileSync('tmp.js', stdin);
      stdout = exec([ // eslint-disable-line
        `cat tmp.js | ${getFlowBin()}`,
        'check-contents --json --root',
        `${root} ${filepath}`
      ].join(' '), { silent: true });
      fs.unlinkSync('tmp.js');
      break;
      // stdout = echo(stdin).exec([ // eslint-disable-line
      //   `${getFlowBin()}`,
      //   'check-contents --json --root',
      //   `${root} ${filepath}`
      // ].join(' '), { silent: true });
      // break;
    default:
      stdout = childProcess.spawnSync(getFlowBin(), ['--json']).stdout;
  }

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
  const output = parsedJSONArray.errors.map(({ message }) => {
    const [firstMessage, ...remainingMessages] = message;

    const entireMessage = `${firstMessage.descr}: ${
      remainingMessages.reduce((previous, current) => (
        previous + (current.type === 'Blame' ? ` '${current.descr}' ` : current.descr)
      ), '')
    }`;

    if (firstMessage.descr === 'inconsistent use of library definitions') {
      return {
        ...(process.env.DEBUG_FLOWTYPE_ERRRORS === 'true' ? parsedJSONArray : {}),
        message: entireMessage,
        path: firstMessage.path,
        start: 0,
        loc: {
          start: {
            line: 0
          }
        }
      };
    }

    return {
      ...(process.env.DEBUG_FLOWTYPE_ERRRORS === 'true' ? parsedJSONArray : {}),
      message: entireMessage,
      path: firstMessage.path,
      start: firstMessage.loc.start.line,
      end: firstMessage.loc.end.line,
      loc: firstMessage.loc
    };
  });

  return output;
}

export default function Collect(stdin, root, filepath) {
  return executeFlow(stdin, root, filepath, {});
}
