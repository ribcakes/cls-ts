/**
 * @module Namespace
 */

import * as assert from 'assert';
import * as asyncHooks from 'async_hooks';
// @ts-ignore: emitter-listener has no types
import * as wrapEmitter from 'emitter-listener';
import { EventEmitter } from 'events';
import { ERROR_SYMBOL } from './async-integration';
import { printDebug } from './debug';
import { Context, CONTEXT_ID_SYMBOL, CONTEXT_NAMESPACE_NAME_SYMBOL } from './interface';
import { weak } from './weak';

/**
 * The symbol used when attaching {@link Context}s to an {@link EventEmitter} listener.
 */
export const CONTEXTS_SYMBOL = Symbol('contexts@namespace');

/**
 * Namespaces group values together under a specific name to allow multiple sets of similar values to be tracked without interfering with
 * each other.
 */
export class Namespace implements asyncHooks.HookCallbacks {
  /**
   * The symbol used when attaching {@link Context}s to an {@link EventEmitter} listener.
   */
  private readonly contextSymbol: symbol;
  /**
   * The currently active {@link Context}.
   */
  private _active: Context = undefined;
  /**
   * The stack of {@link Context}s that have been entered.
   */
  private _stack: Context[] = [];
  /**
   * The map of entered {@link Context}s mapped to their `asyncId`.
   */
  private _contexts: Map<number, Context> = new Map<number, Context>();
  /**
   * The number of contexts entered.
   *
   * This value is used to indent the debug output to make it easier to understand.
   */
  private _indent: number = 0;
  /**
   * The map of {@link Context}s who have received a `promiseResolve` callback, but not yet received an `after` callback.
   */
  private _resolvedContexts: Map<number, Context> = new Map<number, Context>();

  /**
   * Default constructor that initializes the {@link Namespace}'s {@link contextSymbol}.
   *
   * @param name - The name of the {@link Namespace}.
   */
  public constructor(private readonly name: string) {
    this.contextSymbol = Symbol(`context@${this.name}`);
  }

  /**
   * {@link asyncHooks.HookCallbacks} `init` implementation. This method `assigns()`s a {@link Context} with the given `asyncId`, if one is
   * active, otherwise try to use the .
   *
   * @param asyncId a unique ID for the async resource
   * @param type the type of the async resource
   * @param triggerAsyncId the unique ID of the async resource in whose execution context this async resource was created
   * @param resource reference to the resource representing the async operation, needs to be released during destroy
   *
   * @see asyncHooks.HookCallbacks
   * @see enter
   */
  public init(asyncId: number, type: string, triggerAsyncId: number, resource: Record<string, any>): void {
    const debugContext = {
      type,
      name: this.name,
      asyncId,
      executionId: asyncHooks.executionAsyncId(),
      triggerId: asyncHooks.triggerAsyncId(),
      setLength: this._stack.length
    };

    if (this.active) {
      this.assignContext(asyncId, this.active);
      printDebug('[init] with active', debugContext, this.indent);
    } else if (asyncHooks.executionAsyncId() === 0) {
      /*
       * ExecutionAsyncId will be 0 when triggered from C++. Promise events
       * https://github.com/nodejs/node/blob/master/doc/api/async_hooks.md#triggerid
       */
      const triggerIdContext: Context = this.getContext(triggerAsyncId);
      if (null == triggerIdContext) {
        printDebug('[init] missing context', debugContext, this.indent);
      } else {
        this.assignContext(asyncId, triggerIdContext);
        printDebug('[init] using context from trigger id', debugContext, this.indent);
      }

      if ('PROMISE' === type) {
        printDebug('[init] promise', { ...debugContext, parentId: resource.parentId, resource }, this.indent);
      }
    }
  }

  /**
   * {@link asyncHooks.HookCallbacks} `before` implementation. This method `enter()`s the {@link Context} associated with the given
   * `asyncId`, if any.
   *
   * @param asyncId the unique identifier assigned to the resource which has executed the callback.
   *
   * @see asyncHooks.HookCallbacks
   * @see enter
   */
  public before(asyncId: number): void {
    const debugContext = {
      name: this.name,
      asyncId,
      executionId: asyncHooks.executionAsyncId(),
      triggerId: asyncHooks.triggerAsyncId(),
      setLength: this._stack.length
    };

    const context: Context = this.getContext(asyncId);
    if (context) {
      printDebug('[before]', { ...debugContext, context }, this.indent);
      this.enter(context);
    } else {
      printDebug('[before] missing context', debugContext, this.indent);
    }
    this.updateIndent(1);
  }

  /**
   * {@link asyncHooks.HookCallbacks} `after` implementation. This method `exit()`s the {@link Context} associated with the given
   * `asyncId`, if any.
   *
   * @param asyncId the unique identifier assigned to the resource which has executed the callback.
   *
   * @see asyncHooks.HookCallbacks
   * @see exit
   */
  public after(asyncId: number): void {
    const debugContext = {
      name: this.name,
      asyncId,
      executionId: asyncHooks.executionAsyncId(),
      triggerId: asyncHooks.triggerAsyncId(),
      setLength: this._stack.length
    };

    this.updateIndent(-1);
    let context = this.getContext(asyncId);
    if (null == context) {
      const weakContext = this._resolvedContexts.get(asyncId);
      if (null == weakContext) {
        printDebug('[after] missing context', debugContext, this.indent);
        return;
      }
      context = weak.get(weakContext);
      // @ts-ignore
      debugContext.deletedContext = true;
    }

    printDebug('[after]', { ...debugContext, context }, this.indent);
    this.exit(context);
    this._resolvedContexts.delete(asyncId);
  }

  /**
   * {@link asyncHooks.HookCallbacks} `destroy` implementation. This method `deletes` the {@link Context} associated with the given
   * `asyncId`.
   *
   * @param asyncId the unique identifier assigned to the resource which has executed the callback.
   *
   * @see asyncHooks.HookCallbacks
   * @see deleteContext
   */
  public destroy(asyncId: number): void {
    printDebug(
      '[destroy]',
      {
        name: this.name,
        asyncId,
        executionId: asyncHooks.executionAsyncId(),
        triggerId: asyncHooks.triggerAsyncId(),
        active: this.active
      },
      this.indent
    );
    this.deleteContext(asyncId);
  }

  /**
   * {@link asyncHooks.HookCallbacks} `promiseResolve` implementation. This method `deletes` the {@link Context} associated with the given
   * `asyncId`, caching it so it can be `exit()`ed.
   *
   * @param asyncId the unique identifier assigned to the resource which has executed the callback.
   *
   * @see asyncHooks.HookCallbacks
   * @see deleteContext
   */
  public promiseResolve(asyncId: number): void {
    printDebug(
      '[promiseResolve]',
      {
        name: this.name,
        asyncId,
        executionId: asyncHooks.executionAsyncId(),
        triggerId: asyncHooks.triggerAsyncId(),
        active: this.active
      },
      this.indent
    );
    const context: Context = this.getContext(asyncId);
    this.deleteContext(asyncId);
    /*
     * The `promiseResolve` hook callback is called before the `after` callback for promises, causing contexts on the stack to not be popped
     * By keeping track of the contexts of resolved promises, we can ensure the stack gets cleaned up.
     */
    if (null != context) {
      this._resolvedContexts.set(asyncId, weak(context));
    }
  }

  /**
   * Returns the currently active context.
   */
  public get active(): Context {
    return this._active;
  }

  /**
   * Assigns the given {@link Context} to the given `asyncId`.
   *
   * @param asyncId - The `asyncId` to associate the given {@link Context} with.
   * @param context - The {@link Context} to associate.
   */
  public assignContext(asyncId: number, context: Context): void {
    printDebug(
      '[assignContext]',
      {
        asyncId,
        context,
        name: this.name,
        executionId: asyncHooks.executionAsyncId(),
        triggerId: asyncHooks.triggerAsyncId(),
        active: this.active
      },
      this.indent
    );
    this._contexts.set(asyncId, context);
  }

  /**
   * Returns the {@link Context} associated with the given `asyncId`.
   *
   * @param asyncId - The `asyncId` of the {@link Context} to retrieve.
   */
  public getContext(asyncId: number): Context {
    return this._contexts.get(asyncId);
  }

  /**
   * Deletes the {@link Context} associated with the given `asyncId`.
   *
   * @param asyncId - The `asyncId` of the {@link Context} to delete.
   */
  public deleteContext(asyncId: number): void {
    this._contexts.delete(asyncId);
  }

  /**
   * Prints debug information, including all tracked {@link Context}s.
   *
   * Note: This will do nothing unless `process.env.DEBUG_CLS_TS` is set to `'true'`.
   */
  public dumpContexts(): void {
    printDebug(
      '[dumpContexts]',
      {
        name: this.name,
        executionId: asyncHooks.executionAsyncId(),
        triggerId: asyncHooks.triggerAsyncId(),
        contexts: this._contexts,
        deletedContexts: this._resolvedContexts,
        stack: this._stack
      },
      this.indent
    );
  }

  /**
   * Attaches the given `value` to the active {@link Context} under the given `key`. Must be set within an active continuation chain
   * started with `namespace.run()` or `namespace.bind()`.
   *
   * @param key - The `key` to attach the given `value` with.
   * @param value - The `value` to attach to the active {@link Context}.
   *
   * @throws {@link Error} if there is no active {@link Context}
   */
  public set<T>(key: string, value: T): T {
    if (!this.active) {
      throw new Error('No context available. ns.run() or ns.bind() must be called first.');
    }
    this.active[key] = value;

    printDebug(
      '[set]',
      {
        key,
        value,
        executionId: asyncHooks.executionAsyncId(),
        triggerId: asyncHooks.triggerAsyncId(),
        active: this.active
      },
      this.indent
    );
    return value;
  }

  /**
   * Retrieves the value associated with the given `key`, if any, recursively searching from the innermost to outermost nested continuation
   * context for a value associated with a given key. If there is no active context, `undefined` is returned.
   *
   * @param key - The `key` whose value to return.
   */
  public get<T>(key: string): T {
    const debugContext = {
      key,
      active: this._active,
      name: this.name,
      executionId: asyncHooks.executionAsyncId(),
      triggerId: asyncHooks.triggerAsyncId(),
      setLength: this._stack.length
    };
    if (!this.active) {
      printDebug('[get] no active context', debugContext, this.indent);
      return undefined;
    }
    const value = this.active[key];

    printDebug('[get]', { key, ...debugContext }, this.indent);

    return value;
  }

  /**
   * Returns the current indent of this {@link Namespace}.
   */
  public get indent(): number {
    return this._indent;
  }

  /**
   * Updates the indent of this {@link Namespace} by the given number of increments.
   *
   * @param increments - the number of increments to add to the indent.
   */
  public updateIndent(increments: number): void {
    this._indent = Math.max(0, this._indent + increments);
  }

  /**
   * Creates a new {@link Context} using the active {@link Context} as its prototype, if any.
   *
   * Use this with `namespace.bind()`, if you want to have a fresh context at invocation time, as opposed to binding time.
   */
  public createContext(): Context {
    // Prototype inherit existing context if created a new child context within existing context.
    const context: Context = Object.create(this.active ? this.active : Object.prototype);
    context[CONTEXT_NAMESPACE_NAME_SYMBOL] = this.name;
    context[CONTEXT_ID_SYMBOL] = asyncHooks.executionAsyncId();

    printDebug(
      '[createContext]',
      {
        active: this.active,
        name: this.name,
        executionId: asyncHooks.executionAsyncId(),
        triggerId: asyncHooks.triggerAsyncId(),
        setLength: this._stack.length
      },
      this.indent
    );

    return context;
  }

  /**
   * Runs the given `fn`, creating a new {@link Context} for the execution, providing it to the given `fn`, and returning it when execution
   * completes.
   *
   * @param fn - The function to run.
   */
  public run(fn: (context: Context) => void): Context {
    const context: Context = this.createContext();
    this.enter(context);

    try {
      printDebug(
        '[run] begin',
        {
          name: this.name,
          executionId: asyncHooks.executionAsyncId(),
          triggerId: asyncHooks.triggerAsyncId(),
          setLength: this._stack.length,
          context
        },
        this.indent
      );
      fn(context);
      printDebug(
        '[run] function executed',
        {
          name: this.name,
          executionId: asyncHooks.executionAsyncId(),
          triggerId: asyncHooks.triggerAsyncId(),
          setLength: this._stack.length,
          context
        },
        this.indent
      );
      return context;
    } catch (error) {
      printDebug(
        '[run] caught error',
        {
          name: this.name,
          executionId: asyncHooks.executionAsyncId(),
          triggerId: asyncHooks.triggerAsyncId(),
          setLength: this._stack.length,
          context
        },
        this.indent
      );
      try {
        /*
         * handle exception(throw by user) which is not an error object.
         * exception: null, undefined, string(when 'use strict') etc.
         */
        error[ERROR_SYMBOL] = context;
      } catch (ex) {
        // intentionally blank
      }
      throw error;
    } finally {
      printDebug(
        '[run] end',
        {
          name: this.name,
          executionId: asyncHooks.executionAsyncId(),
          triggerId: asyncHooks.triggerAsyncId(),
          setLength: this._stack.length,
          context
        },
        this.indent
      );
      this.exit(context);
    }
  }

  /**
   * Runs the given `fn`, creating a new {@link Context} for the execution, providing it to the given `fn`, and returning the result.
   *
   * @param fn - The function to run.
   * @see Namespace.run
   */
  public runAndReturn<T>(fn: (context: Context) => T): T {
    let value: T;
    this.run((context: Context) => {
      value = fn(context);
    });
    return value;
  }

  /**
   * Runs the given {@link Promise} producing function, creating a new {@link Context} for the execution, providing it to the given `fn`,
   * and returning the resulting Promise.
   *
   * Note: The `Promise` returned by the function only needs to be `Promise-like`. It must at minimum have a `then` and `catch` function,
   * and not be null.
   *
   * @param fn - The function to run.
   *
   * @throws {@link Error} if the return from the function is null, or does not define both the `then` and `catch` functions
   */
  public runPromise<T>(fn: (context: Context) => Promise<T>): Promise<T> {
    const context: Context = this.createContext();
    this.enter(context);

    printDebug(
      '[runPromise] begin',
      {
        name: this.name,
        executionId: asyncHooks.executionAsyncId(),
        triggerId: asyncHooks.triggerAsyncId(),
        setLength: this._stack.length,
        context
      },
      this.indent
    );

    const promise: Promise<T> = fn(context);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    if (!promise || !promise.then || !promise.catch) {
      throw new Error('function must return a promise.');
    }

    return promise
      .then((result: T) => {
        printDebug(
          '[runPromise] after then',
          {
            name: this.name,
            executionId: asyncHooks.executionAsyncId(),
            triggerId: asyncHooks.triggerAsyncId(),
            setLength: this._stack.length,
            context
          },
          this.indent
        );
        this.exit(context);
        return result;
      })
      .catch((error: unknown) => {
        try {
          /*
           * handle exception(throw by user) which is not an error object.
           * exception: null, undefined, string(when 'use strict') etc.
           */
          // @ts-ignore
          error[ERROR_SYMBOL] = context;
        } catch (ex) {
          // intentionally blank
        }
        printDebug(
          '[runPromise] after catch',
          {
            name: this.name,
            executionId: asyncHooks.executionAsyncId(),
            triggerId: asyncHooks.triggerAsyncId(),
            setLength: this._stack.length,
            context
          },
          this.indent
        );
        this.exit(context);
        throw error;
      });
  }

  /**
   * Binds the given `fn` to the given {@link Context}. If no context is provided, it will default to the currently active {@link Context},
   * or create a new {@link Context} if none is currently defined.
   *
   * @param fn - The function to run.
   * @param context - The optional {@link Context} to bind the function to.
   */
  public bind<T, A extends unknown[]>(fn: (...args: A) => T, context: Context = this.active || this.createContext()): (...args: A) => T {
    printDebug(
      '[bind]',
      {
        name: this.name,
        executionId: asyncHooks.executionAsyncId(),
        triggerId: asyncHooks.triggerAsyncId(),
        setLength: this._stack.length,
        context
      },
      this.indent
    );

    const self: Namespace = this;
    return function(...args: A): T {
      self.enter(context);
      try {
        // eslint-disable-next-line no-invalid-this
        return fn.apply(this, args);
      } catch (error) {
        try {
          /*
           * handle exception(throw by user) which is not an error object.
           * exception: null, undefined, string(when 'use strict') etc.
           */
          error[ERROR_SYMBOL] = context;
        } catch (ex) {
          // intentionally blank
        }
        throw error;
      } finally {
        self.exit(context);
      }
    };
  }

  /**
   * Enters the given {@link Context}, pushing the active context onto the stack and setting the given {@link Context} as the active.
   *
   * @param context - The {@link Context} to enter.
   *
   * @throws {@link AssertionError} if the given {@link Context} was falsey
   */
  public enter(context: Context): void {
    assert.ok(context, 'context must be provided for entering');
    printDebug(
      '[enter]',
      {
        name: this.name,
        executionId: asyncHooks.executionAsyncId(),
        triggerId: asyncHooks.triggerAsyncId(),
        setLength: this._stack.length,
        context
      },
      this.indent
    );
    this._stack.push(this.active);
    this._active = context;
  }

  /**
   * Exits the given {@link Context}. If the given {@link Context} was the active {@link Context}, it is replaced by the top
   * {@link Context} in the stack, otherwise it is simply deleted from the stack.
   *
   * @param context - The {@link Context} to exit.
   *
   * @throws {@link AssertionError} if the given {@link Context} was falsey
   * @throws {@link AssertionError} if the given {@link Context} was the active {@link Context}, and the stack is empty
   * @throws {@link AssertionError} if the given {@link Context} was not previously entered
   * @throws {@link AssertionError} if the given {@link Context} is the only {@link Context} in the stack
   */
  public exit(context: Context): void {
    const debugContext = {
      name: this.name,
      executionId: asyncHooks.executionAsyncId(),
      triggerId: asyncHooks.triggerAsyncId(),
      setLength: this._stack.length,
      context
    };
    assert.ok(context, 'context must be provided for exiting');
    printDebug('[exit]', debugContext, this.indent);

    // Fast path for most exits that are at the top of the stack
    if (this.active === context) {
      printDebug('[exit] replacing active context with the top of the context stack', debugContext, this.indent);
      assert.ok(this._stack.length, "can't remove top context");
      this._active = this._stack.pop();
      return;
    }

    // Fast search in the stack using lastIndexOf
    const index: number = this._stack.lastIndexOf(context);
    if (index < 0) {
      printDebug("[exit] context wasn't entered, was it destroyed?", debugContext, this.indent);
      return;
    }
    assert.ok(index, "can't remove top context");

    printDebug('[exit] deleting context from set', { ...debugContext, index }, this.indent);
    this._stack.splice(index, 1);
  }

  /**
   * Binds the given {@link EventEmitter} to this {@link Namespace}, effectively {@link Namespace.bind}ing every listener registered on the
   * given {@link EventEmitter} from this point forward to this {@link Namespace}.
   *
   * The most likely time you'd want to use this is when you're using Express or Connect and want to make sure your middleware execution
   * plays nice with CLS, or are doing other things with HTTP listeners.
   *
   *  @param emitter - The {@link EventEmitter} to bind.
   *
   * @throws {@link AssertionError} if the given `emitter` doesn't implement at least `on`, `addListener`, and `emit`.
   */
  public bindEmitter(emitter: EventEmitter): void {
    assert.ok(emitter.on && emitter.addListener && emitter.emit, 'can only bind real EEs');
    const debugContext = {
      name: this.name,
      executionId: asyncHooks.executionAsyncId(),
      triggerId: asyncHooks.triggerAsyncId(),
      setLength: this._stack.length,
      emitter
    };
    printDebug('[bind emitter] start', debugContext, this.indent);
    const weakNamespace: this = weak(this);

    // Capture the context active at the time the emitter is bound.
    const attach = function(listener: (...args: unknown[]) => unknown): void {
      const namespace: Namespace = weak.get(weakNamespace);
      if (!namespace || !namespace.active) {
        return;
      }

      // @ts-ignore
      if (!listener[CONTEXTS_SYMBOL]) {
        // @ts-ignore
        listener[CONTEXTS_SYMBOL] = Object.create(null);
      }

      // @ts-ignore
      listener[CONTEXTS_SYMBOL][namespace.contextSymbol] = {
        namespace: weakNamespace,
        context: weak(namespace.active)
      };
    };

    // At emit time, bind the listener within the correct context.
    const bind = function(unwrapped: (...args: unknown[]) => unknown): unknown {
      // @ts-ignore
      if (!(unwrapped && unwrapped[CONTEXTS_SYMBOL])) {
        return unwrapped;
      }

      let wrapped = unwrapped;
      // @ts-ignore
      const unwrappedContexts: { [key: symbol]: { namespace: Namespace; context: Context } } = unwrapped[CONTEXTS_SYMBOL];
      Object.getOwnPropertySymbols(unwrappedContexts).forEach((name: symbol) => {
        // @ts-ignore
        const { namespace, context }: { namespace: Namespace; context: Context } = unwrappedContexts[name];
        if (!weak.get(namespace) || !weak.get(context)) {
          // @ts-ignore
          delete unwrappedContexts[name];
          return;
        }
        wrapped = namespace.bind(wrapped, context);
      });
      return wrapped;
    };

    wrapEmitter(emitter, attach, bind);
    printDebug('[bind emitter] end', debugContext, this.indent);
  }

  /**
   * Resets this {@link Namespace} by removing the active {@link Namespace}, as well as the map and stack of {@link Context}s.
   */
  public reset(): void {
    printDebug(
      '[reset]',
      {
        name: this.name,
        executionId: asyncHooks.executionAsyncId(),
        triggerId: asyncHooks.triggerAsyncId(),
        setLength: this._stack.length,
        indent: this.indent
      },
      this.indent
    );
    this._active = undefined;
    this._contexts.clear();
    this._stack = [];
    this._indent = 0;
  }
}
