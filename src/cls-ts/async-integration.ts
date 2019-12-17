/**
 * @module main
 */

import * as assert from 'assert';
import * as asyncHooks from 'async_hooks';
import { printDebug } from './debug';
import { Context } from './interface';
import { Namespace } from './Namespace';

/**
 * The symbol used to attach a {@link Context} to an `Error` thrown by wrapped code.
 *
 * This gets used by the {@link Namespace.run}, {@link Namespace.runPromise} and {@link Namespace.bind} functions.
 */
export const ERROR_SYMBOL = Symbol('error@namespace');

/**
 * Map of all {@link Namespace}s keyed by their names.
 */
const namespaces: Map<string, Namespace> = new Map<string, Namespace>();

/**
 * Map of all {@link asyncHooks.AsyncHook} keyed by their names.
 */
const hooks: Map<string, asyncHooks.AsyncHook> = new Map<string, asyncHooks.AsyncHook>();

/**
 * Returns the {@link Namespace} with the given `name`.
 *
 * @param name - the name of the {@link Namespace} to retrieve.
 */
export const getNamespace = function(name: string): Namespace {
  return namespaces.get(name);
};

/**
 * Creates a new {@link Namespace}, registering a new async hook via {@link asyncHooks.createHook}, and enabling it.
 *
 * Each application wanting to use continuation-local values should create its own namespace. Reading from (or, more significantly, writing
 * to) namespaces that don't belong to you is a faux pas.
 *
 * @param name - the name of the {@link Namespace} to create.
 */
export const createNamespace = function(name: string): Namespace {
  assert.ok(name, 'namespace must be given a name.');
  printDebug('[createNamespace] Creating namespace', { name });

  const namespace = new Namespace(name);
  const hook: asyncHooks.AsyncHook = asyncHooks.createHook({
    init(asyncId: number, type: string, triggerAsyncId: number, resource: Record<string, any>): void {
      namespace.init(asyncId, type, triggerAsyncId, resource);
    },
    before(asyncId: number): void {
      namespace.before(asyncId);
    },
    after(asyncId: number): void {
      namespace.after(asyncId);
    },
    destroy(asyncId: number): void {
      namespace.destroy(asyncId);
    },
    promiseResolve(asyncId: number): void {
      namespace.promiseResolve(asyncId);
    }
  });
  hook.enable();
  hooks.set(name, hook);

  namespaces.set(name, namespace);
  return namespace;
};

/**
 * Destroys the {@link Namespace} with the given name, disabling its {@link asyncHooks.AsyncHook}.
 *
 * WARNING: be sure to dispose of any references to destroyed namespaces in your old code, as contexts associated with them will no longer
 * be propagated.
 *
 * @param name - the name of the {@link Namespace} to destroy.
 * @see Namespace.reset
 */
export const destroyNamespace = function(name: string): void {
  const namespace: Namespace = namespaces.get(name);
  namespace.reset();
  namespaces.delete(name);

  const hook: asyncHooks.AsyncHook = hooks.get(name);
  hook.disable();
  hooks.delete(name);
};

/**
 * Resets the cls-ts module, calling {@link destroyNamespace} on every tracked {@link Namespace}.
 *
 * WARNING: while this will stop the propagation of values in any existing namespaces, if there are remaining references to those
 * namespaces in code, the associated storage will still be reachable, even though the associated state is no longer being updated. Make
 * sure you clean up any references to destroyed namespaces yourself.
 */
export const reset = function(): void {
  namespaces.forEach((namespace: Namespace, name: string): void => destroyNamespace(name));
};

/**
 * Retrieves the {@link Context} bound to the given `exception`, if any.
 *
 * @param exception - The exception to extract the {@link Context} from.
 */
export const fromException = function(exception: unknown): Context {
  // @ts-ignore
  return exception && exception[ERROR_SYMBOL];
};
