/**
 * Run Flow and collect errors in JSON format
 *
 * Reference the following links for possible bug fixes and optimizations
 * https://github.com/facebook/nuclide/blob/master/pkg/nuclide-flow-rpc/lib/FlowRoot.js
 * https://github.com/ptmt/tryflow/blob/gh-pages/js/worker.js
 */
import pathModule from 'path';
import childProcess from 'child_process';
import slash from 'slash';
import filter from './filter';


let flowBin;

try {
  if (!process.env.FLOW_BIN) {
    flowBin = require('flow-bin'); // eslint-disable-line global-require
  }
} catch (e) {
  /* eslint-disable */
  console.log();
  console.log('Oops! Something went wrong! :(');
  console.log();
  console.log('eslint-plugin-flowtype-errors could not find the package "flow-bin". This can happen for a couple different reasons.');
  console.log();
  console.log('1. If ESLint is installed globally, then make sure "flow-bin" is also installed globally.');
  console.log();
  console.log('2. If ESLint is installed locally, then it\'s likely that "flow-bin" is not installed correctly. Try reinstalling by running the following:');
  console.log();
  console.log('  npm i -D flow-bin@latest');
  console.log();
  process.exit(1);
  /* eslint-enable */
}

// Adapted from https://github.com/facebook/flow/blob/master/tsrc/flowResult.js

type FlowLoc = {
  source: ?string
}

type FlowMessage = {
  descr: string,
  type: "Blame" | "Comment",
  loc?: ?FlowLoc
}

type FlowError = {
  message: Array<FlowMessage>,
  operation?: FlowMessage
}

function mainLocOfError(error: FlowError): ?FlowLoc {
  const { operation, message } = error;
  return operation && operation.loc || message[0].loc;
}

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

function _formatMessage(message, messages, root, path) {
  switch (message.type) {
    case 'Comment':
      return `${message.descr}`;
    case 'Blame': {
      const see = message.path !== ''
                    ? ` See ${
                      path === message.path
                        ? `line ${message.line}`
                        : `.${slash(message.path.replace(root, ''))}:${message.line}`
                      }.`
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
      stdout = childProcess.spawnSync(getFlowBin(), [
        'check-contents',
        '--json',
        `--root=${root}`,
        filepath
      ], {
        input: stdin,
        encoding: 'utf-8'
      }).stdout;
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

  const fullFilepath = pathModule.resolve(root, filepath);

  // Loop through errors in the file
  const output = parsedJSONArray.errors
    // Temporarily hide the 'inconsistent use of library definitions' issue
    .filter(error => {
      const mainLoc = mainLocOfError(error);
      const mainFile = mainLoc && mainLoc.source;
      return (
        mainFile &&
        error.message[0].descr &&
        !error.message[0].descr.includes('inconsistent use of') &&
        pathModule.resolve(root, mainFile) === fullFilepath
      );
    })
    .map(error => {
      const { message, operation } = error;
      const [firstMessage, ...remainingMessages] = [].concat(operation || [], message);
      const entireMessage = `${firstMessage.descr}: ${
        remainingMessages.reduce(
          (previousMessage,
            currentMessage,
            index,
            messages) =>
            `${previousMessage} ${_formatMessage(
              currentMessage,
              messages,
              root,
              firstMessage.path
            )}`,
          ''
        )
      }`;

      return {
        ...(process.env.DEBUG_FLOWTYPE_ERRRORS === 'true' ? parsedJSONArray : {}),
        message: entireMessage.replace(/\.$/, ''),
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

export default function collect(stdin, root, filepath) {
  return executeFlow(stdin, root, filepath);
}
