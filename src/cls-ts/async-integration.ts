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
 * The execution async id of the current async context.
 */
let currentUid = -1;

/**
 * Returns the async execution id of the current async context.
 */
export const getCurrentUid = function(): number {
  return currentUid;
};

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
      currentUid = asyncHooks.executionAsyncId();
      const debugContext = {
        type,
        name,
        asyncId,
        currentUid,
        triggerId: triggerAsyncId,
        active: namespace.active
      };

      if (namespace.active) {
        namespace.assignContext(asyncId, namespace.active);
        printDebug('[init] with active', debugContext, namespace.indent);
      } else if (currentUid === 0) {
        /*
         * CurrentId will be 0 when triggered from C++. Promise events
         * https://github.com/nodejs/node/blob/master/doc/api/async_hooks.md#triggerid
         */
        const triggerIdContext: Context = namespace.getContext(triggerAsyncId);
        if (null == triggerIdContext) {
          printDebug('[init] missing context', debugContext, namespace.indent);
        } else {
          namespace.assignContext(asyncId, triggerIdContext);
          printDebug('[init] using context from trigger id', debugContext, namespace.indent);
        }

        if ('PROMISE' === type) {
          printDebug('[init] promise', { ...debugContext, parentId: resource.parentId, resource }, namespace.indent);
        }
      }
    },
    before(asyncId: number): void {
      currentUid = asyncHooks.executionAsyncId();
      const debugContext = {
        name,
        asyncId,
        currentUid,
        triggerId: asyncHooks.triggerAsyncId(),
        active: namespace.active
      };

      const context: Context = namespace.getContext(asyncId) || namespace.getContext(currentUid);
      if (context) {
        printDebug('[before]', { ...debugContext, context }, namespace.indent);
        namespace.enter(context);
      } else {
        printDebug('[before] missing context', debugContext, namespace.indent);
      }
      namespace.updateIndent(1);
    },
    after(asyncId: number): void {
      currentUid = asyncHooks.executionAsyncId();
      const debugContext = {
        name,
        asyncId,
        currentUid,
        triggerId: asyncHooks.triggerAsyncId(),
        active: namespace.active
      };
      namespace.updateIndent(-1);

      const context: Context = namespace.getContext(asyncId) || namespace.getContext(currentUid);
      if (context) {
        printDebug('[after]', { ...debugContext, context }, namespace.indent);
        namespace.exit(context);
      } else {
        printDebug('[after] missing context', debugContext, namespace.indent);
      }
    },
    destroy(asyncId: number): void {
      currentUid = asyncHooks.executionAsyncId();
      printDebug(
        '[destroy]',
        {
          name,
          asyncId,
          currentUid,
          triggerId: asyncHooks.triggerAsyncId(),
          active: namespace.active,
          context: namespace.getContext(asyncId)
        },
        namespace.indent
      );
      namespace.deleteContext(asyncId);
    },
    promiseResolve(asyncId: number): void {
      currentUid = asyncHooks.executionAsyncId();
      printDebug(
        '[promiseResolve]',
        {
          name,
          asyncId,
          currentUid: asyncHooks.executionAsyncId(),
          triggerId: asyncHooks.triggerAsyncId(),
          active: namespace.active,
          context: namespace.getContext(currentUid)
        },
        namespace.indent
      );
      namespace.deleteContext(asyncId);
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
