/* @flow */

import type { EslintContext } from './context';

export class Script {
  start: number;
  code: string;
  constructor(start: number, code: string = '') {
    this.start = start;
    this.code = code;
  }

  appendLine (line: string) {
    return new Script(this.start, [this.code, line].join(''));
  }
}

function parseCodeBlockLine(line, { scripts, script }) {
  if (/<\/script>/.test(line)) {
    scripts.push(script);
    return { scripts };
  }

  return { scripts, script: script.appendLine(line) };
}

function parseHtmlBlockLine(line, idx, { scripts }) {
  if (/<script>/.test(line)) {
    return { scripts, script: new Script(idx + 1) };
  }

  return { scripts };
}

function parseLine(state, line, idx) {
  if (state.script) {
    return parseCodeBlockLine(line, state);
  }

  return parseHtmlBlockLine(line, idx, state);
}

function extractHtmlScripts(code) {
  const lines = code.match(/[^\r\n]*[\r\n]+/g);

  const res = lines.reduce(parseLine, { scripts: [] });
  return res.scripts;
}

function isHtmlLike(context): boolean {
  return /(\.html)|(\.vue)$/.test(context.getFilename());
}

export function getScripts(context: EslintContext): [Script] {
  const code = context.getSourceCode().getText();

  if (isHtmlLike(context)) {
    return extractHtmlScripts(code);
  }

  return [ new Script(0, code) ];
}
