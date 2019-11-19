/**
 * Enables support for weak references.
 * @module weak
 */
/**
 * Ideally the [weak-napi](https://www.npmjs.com/package/weak-napi) package. In the event no such package is available, this property will
 * be composed of identity functions that return the given object.
 */
let weak: {
  /*
   * The typings defined for `weak-napi` return a generic `WeakRef` type from this call with no methods that is not exported. However,
   * the return of this call is a proxy for the passed in object, which means we can define the return's type as if it were the passed in
   * object.
   */
  <T>(obj: T, callback?: () => void): T;
  get: <T>(ref: T) => T | undefined;
};
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  weak = require('weak-napi');
} catch (e) {
  weak = Object.assign(<T>(x: T): T => x, { get: <T>(x: T): T => x });
}

export { weak };
