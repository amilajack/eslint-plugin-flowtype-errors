/**
 * Run Flow and collect errors in JSON format
 *
 * Reference the following links for possible bug fixes and optimizations
 * https://github.com/facebook/nuclide/blob/master/pkg/nuclide-flow-rpc/lib/FlowRoot.js
 * https://github.com/ptmt/tryflow/blob/gh-pages/js/worker.js
 */
import flowBin from 'flow-bin';
import childProcess from 'child_process';
import shell from 'shelljs';
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

function replaceAll(string, search, replacement) {
  return string.split(search).join(replacement);
}

function _formatMessage(message, messages, root) {
  switch (message.type) {
    case 'Comment':
      return `${message.descr}`;
    case 'Blame': {
      const see = message.path !== ''
                    ? ` See .${
                        replaceAll(message.path.replace(root, ''), '\\', '').replace('..', '.')
                      }:${message.line}`
                    : '';
      return `'${message.descr}'.${see}`;
    }
    default:
      return `'${message.descr}'.`;
  }
}

function getFlowBin() {
  return process.env.FLOW_BIN || flowBin;
}

function executeFlow(stdin, root, filepath) {
  let stdout;

  switch (stdin && root && filepath && stdin !== '') {
    case true:
      stdout = (new shell.ShellString(stdin)).exec([
        `${getFlowBin()}`,
        'check-contents --json --root',
        `${root} ${filepath}`
      ].join(' '), { silent: true });
      break;
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
  const output = parsedJSONArray.errors
    // Temporarily hide the 'inconsistent use of library definitions' issue
    .filter(({ message }) => (
      !message[0].descr.includes('inconsistent use of') &&
      message[0].path === filepath &&
      message[0].descr &&
      message[0].descr !== ''
    ))
    .map(({ message }) => {
      const [firstMessage, ...remainingMessages] = message;
      const entireMessage = `${firstMessage.descr}: ${
        remainingMessages.reduce(
          (previousMessage,
            currentMessage,
            index,
            messages) => `${previousMessage} ${_formatMessage(currentMessage, messages, root)}`,
          ''
        )
      }`;

      return {
        ...(process.env.DEBUG_FLOWTYPE_ERRRORS === 'true' ? parsedJSONArray : {}),
        message: entireMessage,
        path: firstMessage.path,
        start: firstMessage.loc.start.line,
        end: firstMessage.loc.end.line,
        loc: firstMessage.loc
      };
    });

  return output.length
    ? filter(output)
    : true;
}

export default function Collect(stdin, root, filepath) {
  return executeFlow(stdin, root, filepath, {});
}
