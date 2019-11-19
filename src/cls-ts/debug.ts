/**
 * @module debug
 */

import * as util from 'util';

/**
 * The number of spaces to indent the log lines by for a single indent.
 */
const INDENT_SIZE = 2;

/**
 * Prints the given `message` and `info` object to {@link process.\_rawDebug}, using {@link util.inspect} to depth `2` on the given `info`
 * object if the `DEBUG_CLS_TS` environment variable is set to `'true'`.
 *
 * The printed message will be indented according to the given `indent` value, if any.
 *
 * @param message - the string message to print
 * @param info - an optional context object to print
 * @param indent - an optional number value to indent the output
 */
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
