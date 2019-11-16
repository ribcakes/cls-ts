/**
 * Module containing type interfaces.
 * @module types
 */

/**
 * The symbol used to attach the name of the owning {@link Namespace} to a {@link Context}.
 */
export const CONTEXT_NAMESPACE_NAME_SYMBOL = Symbol('namespaceName@context');

/**
 * The symbol used to attach the uid to a {@link Context}.
 */
export const CONTEXT_ID_SYMBOL = Symbol('id@context');

/**
 * A container for state to be shared across continuations.
 */
export interface Context {
  [CONTEXT_NAMESPACE_NAME_SYMBOL]: string;
  [CONTEXT_ID_SYMBOL]: number;
  [key: string]: any;
}
