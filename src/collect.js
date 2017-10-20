/* @flow */
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
  console.log(
    'eslint-plugin-flowtype-errors could not find the package "flow-bin". This can happen for a couple different reasons.'
  );
  console.log();
  console.log(
    '1. If ESLint is installed globally, then make sure "flow-bin" is also installed globally.'
  );
  console.log();
  console.log(
    '2. If ESLint is installed locally, then it\'s likely that "flow-bin" is not installed correctly. Try reinstalling by running the following:'
  );
  console.log();
  console.log('  npm i -D flow-bin@latest');
  console.log();
  process.exit(1);
  /* eslint-enable */
}

type Pos = {
  line: number,
  column: number
};

type Loc = {
  start: Pos,
  end: Pos
};

// Adapted from https://github.com/facebook/flow/blob/master/tsrc/flowResult.js
type FlowPos = {
  line: number,
  column: number,
  offset: number
};

type FlowLoc = {
  source: ?string,
  start: FlowPos,
  end: FlowPos
};

type FlowMessage = {
  path: string,
  descr: string,
  type: 'Blame' | 'Comment',
  line: number,
  loc?: ?FlowLoc
};

type FlowError = {
  message: Array<FlowMessage>,
  operation?: FlowMessage,
  extra?: Array<{
    message: Array<FlowMessage>,
    children?: Array<{
      message: Array<FlowMessage>
    }>
  }>
};

function mainLocOfError(error: FlowError): ?FlowLoc {
  const { operation, message } = error;
  return (operation && operation.loc) || message[0].loc;
}

function fatalError(message) {
  return [
    {
      message,
      loc: { start: { line: 1, column: 1 }, end: { line: 1, column: 1 } }
    }
  ];
}

function formatSeePath(
  message: FlowMessage,
  root: string,
  flowVersion: string
) {
  const relativePath = message.path.replace(root, '');
  return relativePath === message.path // The path is for a Flow built-in lib
    ? `https://github.com/facebook/flow/blob/v${flowVersion}/lib/${pathModule.basename(
        message.path
      )}#L${message.line}`
    : `.${slash(relativePath)}:${message.line}`;
}

function formatMessage(
  message: FlowMessage,
  root: string,
  path: string,
  flowVersion: string,
  isOnlyMessage = false
) {
  switch (message.type) {
    case 'Comment':
      return `${message.descr}`;
    case 'Blame': {
      const see =
        message.path !== ''
          ? ` See ${path === message.path
              ? `line ${message.line}`
              : formatSeePath(message, root, flowVersion)}.`
          : '';
      if (isOnlyMessage) {
        return `${message.descr}.${see}`;
      }
      // Omit duplicated message that should already be in `firstMessage` in the collect() function
      return message.descr.startsWith('property `')
        ? see.slice(1)
        : `'${message.descr}'.${see}`;
    }
    default:
      return `'${message.descr}'.`;
  }
}

function getFlowBin() {
  return process.env.FLOW_BIN || flowBin;
}

let didExecute = false;

function onExit(root: string) {
  if (!didExecute) {
    didExecute = true;
    process.on('exit', () =>
      childProcess.spawnSync(getFlowBin(), ['stop', root])
    );
  }
}

function spawnFlow(
  mode: string,
  input: string,
  root: string,
  stopOnExit: boolean,
  filepath: string
): string | boolean {
  if (!input) {
    return true;
  }

  const child = childProcess.spawnSync(
    getFlowBin(),
    [mode, '--json', `--root=${root}`, filepath],
    {
      input,
      encoding: 'utf-8'
    }
  );

  const stdout = child.stdout;

  if (!stdout) {
    // Flow does not support 32 bit OS's at the moment.
    return false;
  }

  if (stopOnExit) {
    onExit(root);
  }

  return stdout.toString();
}

function determineRuleType(description) {
  return description.toLowerCase().includes('missing annotation')
    ? 'missing-annotation'
    : 'default';
}

type CollectOutput = Array<{
  message: string,
  loc: Loc
}>;

export function collect(
  stdin: string,
  root: string,
  stopOnExit: boolean,
  filepath: string
): CollectOutput | boolean {
  const stdout = spawnFlow('check-contents', stdin, root, stopOnExit, filepath);

  if (typeof stdout !== 'string') {
    return stdout;
  }

  let json;

  try {
    json = JSON.parse(stdout);
  } catch (e) {
    return fatalError('Flow returned invalid json');
  }

  if (!Array.isArray(json.errors)) {
    return json.exit
      ? fatalError(
          `Flow returned an error: ${json.exit.msg} (code: ${json.exit.code})`
        )
      : fatalError('Flow returned invalid json');
  }

  const fullFilepath = pathModule.resolve(root, filepath);

  // Loop through errors in the file
  const output = json.errors
    // Temporarily hide the 'inconsistent use of library definitions' issue
    .filter((error: FlowError) => {
      const mainLoc = mainLocOfError(error);
      const mainFile = mainLoc && mainLoc.source;
      return (
        mainFile &&
        error.message[0].descr &&
        !error.message[0].descr.includes('inconsistent use of') &&
        pathModule.resolve(root, mainFile) === fullFilepath
      );
    })
    .map((error: FlowError) => {
      const { message, operation, extra } = error;
      const mainErrorMessage = operation || message[0];

      let firstMessage;
      let remainingMessages = null;

      if (extra !== undefined && extra.length > 0) {
        const children = extra[0].children;
        const childMessages =
          children !== undefined && children.length > 0
            ? children[0].message
            : [];

        [firstMessage, ...remainingMessages] = extra[0].message.concat(
          childMessages
        );
      } else {
        [firstMessage, ...remainingMessages] = [].concat(
          operation || [],
          message
        );
      }

      const entireMessage =
        remainingMessages.length === 0
          ? formatMessage(
              firstMessage,
              root,
              mainErrorMessage.path,
              json.flowVersion,
              true
            )
          : `${firstMessage.descr.replace(
              /:$/,
              ''
            )}: ${remainingMessages
              .map(currentMessage =>
                formatMessage(
                  currentMessage,
                  root,
                  mainErrorMessage.path,
                  json.flowVersion
                )
              )
              .join(' ')}`;

      const loc = mainErrorMessage.loc;
      const finalMessage = entireMessage.replace(/\.$/, '');

      return {
        ...(process.env.DEBUG_FLOWTYPE_ERRRORS === 'true' ? json : {}),
        type: determineRuleType(finalMessage),
        message: finalMessage,
        path: mainErrorMessage.path,
        start: loc && loc.start.line,
        end: loc && loc.end.line,
        loc
      };
    });

  return output;
}

type CoverageOutput = {
  coveredCount: number,
  uncoveredCount: number
};

export function coverage(
  stdin: string,
  root: string,
  stopOnExit: boolean,
  filepath: string
): CoverageOutput | boolean {
  const stdout = spawnFlow('coverage', stdin, root, stopOnExit, filepath);

  if (typeof stdout !== 'string') {
    return stdout;
  }

  let expressions;

  try {
    expressions = JSON.parse(stdout).expressions;
  } catch (e) {
    return {
      coveredCount: 0,
      uncoveredCount: 0
    };
  }

  return {
    coveredCount: expressions.covered_count,
    uncoveredCount: expressions.uncovered_count
  };
}
