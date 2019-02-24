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

export const FlowSeverity = {
  Error: 'error',
  Warning: 'warning'
};

type Pos = {
  line: number,
  column: number
};

type Loc = {
  start: Pos,
  end: Pos
};

type FlowPos = {
  line: number,
  column: number,
  offset: number
};

type FlowLoc = {
  source: string | null,
  start: FlowPos,
  end: FlowPos,
  type:
    | 'LibFile'
    | 'SourceFile'
    | 'JsonFile'
    | 'ResourceFile'
    | 'Builtins'
    | null
};

type FlowSimpleMessage =
  | { kind: 'Text', text: string }
  | { kind: 'Code', text: string };

opaque type FlowReferenceID = string;

type FlowReferenceMessage = {
  kind: 'Reference',
  referenceId: FlowReferenceID,
  message: Array<FlowSimpleMessage>
};

type FlowInlineMessage = FlowSimpleMessage | FlowReferenceMessage;

type FlowUnorderedListMessage = {
  kind: 'UnorderedList',
  message: Array<FlowInlineMessage>,
  items: Array<FlowMessage> // eslint-disable-line no-use-before-define
};

type FlowMessage = Array<FlowInlineMessage> | FlowUnorderedListMessage;

type FlowReferenceLocs = {
  [referenceId: FlowReferenceID]: FlowLoc
};

type FlowError = {
  kind:
    | 'parse'
    | 'infer'
    | 'internal'
    | 'duplicate provider'
    | 'recursion limit exceeded'
    | 'lint',
  level: 'error' | 'warning',
  suppressions: Array<{ loc: FlowLoc }>,
  primaryLoc: FlowLoc,
  rootLoc: FlowLoc | null,
  messageMarkup: FlowMessage,
  referenceLocs: FlowReferenceLocs
};

type ErrorData = {
  errorLoc: FlowLoc,
  referenceLocs: FlowReferenceLocs,
  root: string,
  flowVersion: string,
  lineOffset: number
};

function fatalError(message) {
  return [
    {
      level: FlowSeverity.Error,
      loc: { start: { line: 1, column: 1 }, end: { line: 1, column: 1 } },
      message
    }
  ];
}

function formatSeePath(
  loc: FlowLoc,
  root: string,
  flowVersion: string
): string {
  if (loc.source === null) {
    return '??';
  }

  return loc.type === 'LibFile'
    ? `https://github.com/facebook/flow/blob/v${flowVersion}/lib/${pathModule.basename(
        loc.source
      )}#L${loc.start.line}`
    : `.${slash(loc.source.replace(root, ''))}:${loc.start.line}`;
}

function formatSimpleMessage(message: FlowSimpleMessage): string {
  return message.kind === 'Code' ? `\`${message.text}\`` : message.text;
}

function formatReferenceMessage(
  message: FlowReferenceMessage,
  errorData: ErrorData
): string {
  const { errorLoc, referenceLocs, root, flowVersion, lineOffset } = errorData;
  const referenceLoc = referenceLocs[message.referenceId];
  let messageStr = message.message.map(formatSimpleMessage).join('');

  if (referenceLoc.source !== errorLoc.source) {
    messageStr += ` (see ${formatSeePath(referenceLoc, root, flowVersion)})`;
  } else if (referenceLoc.start.line !== errorLoc.start.line) {
    messageStr += ` (see line ${referenceLoc.start.line + lineOffset})`;
  }

  return messageStr;
}

function formatInlineMessage(
  message: FlowInlineMessage,
  errorData: ErrorData
): string {
  return message.kind === 'Reference'
    ? formatReferenceMessage(message, errorData)
    : formatSimpleMessage(message);
}

function formatInlineMessageArray(
  messages: Array<FlowInlineMessage>,
  errorData: ErrorData
): string {
  return messages
    .map(message => formatInlineMessage(message, errorData))
    .join('');
}

function formatMessage(message: FlowMessage, errorData: ErrorData): string {
  if (Array.isArray(message)) {
    return formatInlineMessageArray(message, errorData);
  }

  return [
    formatInlineMessageArray(message.message, errorData),
    ...message.items.map(itemMessage => formatMessage(itemMessage, errorData))
  ].join(' ');
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
  filepath: string,
  extraOptions?: string[] = []
): string | boolean {
  if (!input) {
    return true;
  }

  /**
   * Workaround for Windows bug: https://github.com/facebook/flow/issues/6834
   * Starting the Flow server before running `check-contents` prevents Flow from hanging.
   */
  if (process.platform === 'win32') {
    childProcess.spawnSync(getFlowBin(), ['start', root]);
  }

  const child = childProcess.spawnSync(
    getFlowBin(),
    [mode, '--json', `--root=${root}`, filepath, ...extraOptions],
    {
      cwd: root,
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
  return description.toLowerCase().includes('missing type annotation')
    ? 'missing-annotation'
    : 'default';
}

export type CollectOutputElement = {
  level: string,
  loc: Loc,
  message: string
};

type CollectOutput = Array<CollectOutputElement>;

export function collect(
  stdin: string,
  root: string,
  stopOnExit: boolean,
  filepath: string,
  programOffset: { line: number, column: number }
): CollectOutput | boolean {
  const stdout = spawnFlow(
    'check-contents',
    stdin,
    root,
    stopOnExit,
    filepath,
    ['--json-version=2']
  );

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

  const output = json.errors.map((error: FlowError) => {
    const loc = error.primaryLoc;

    const message = formatMessage(error.messageMarkup, {
      errorLoc: loc,
      referenceLocs: error.referenceLocs,
      root,
      flowVersion: json.flowVersion,
      lineOffset: programOffset.line
    });

    const newLoc = {
      start: {
        line: loc.start.line + programOffset.line,
        column:
          loc.start.line === 0
            ? loc.start.column + programOffset.column
            : loc.start.column,
        offset: loc.start.offset
      },
      end: {
        line: loc.end.line + programOffset.line,
        column:
          loc.end.line === 0
            ? loc.end.column + programOffset.column
            : loc.end.column,
        offset: loc.end.offset
      }
    };

    return {
      ...(process.env.DEBUG_FLOWTYPE_ERRRORS === 'true' ? json : {}),
      type: determineRuleType(message),
      level: error.level || FlowSeverity.Error,
      message,
      path: loc.source,
      start: newLoc.start.line,
      end: newLoc.end.line,
      loc: newLoc
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
