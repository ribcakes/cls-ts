/**
 * @module debug
 */

import * as util from 'util';

/**
 * The number of spaces to indent the log lines by for a single indent.
 */
const INDENT_SIZE = 2;

export const printDebug = function(message: string, info?: { [key: string]: any }, indent: number = 0): void {
  if ('true' === process.env.DEBUG_CLS_TS) {
    let string = util.inspect({ message, info }, { showHidden: true, depth: 3, colors: true });
    if (indent) {
      string = string.replace(/^/gmu, ' '.repeat(indent * INDENT_SIZE));
    }
    // @ts-ignore
    process._rawDebug(string);
  }
};
