import { z } from "zod";
import type { StateStore } from "@json-render/core";
import type { Toast } from "@rezi-ui/core";

// =============================================================================
// Action Parameter Schemas
// =============================================================================

/**
 * Parameters for setState action.
 */
export const SetStateParamsSchema = z.object({
  /** JSON Pointer path to set (e.g., "/user/name") */
  path: z.string(),
  /** Value to set at the path */
  value: z.unknown(),
});

export type SetStateParams = z.infer<typeof SetStateParamsSchema>;

/**
 * Parameters for pushState action.
 */
export const PushStateParamsSchema = z.object({
  /** JSON Pointer path to array (e.g., "/items") */
  path: z.string(),
  /** Item to append to the array */
  item: z.unknown(),
});

export type PushStateParams = z.infer<typeof PushStateParamsSchema>;

/**
 * Parameters for removeState action.
 */
export const RemoveStateParamsSchema = z.object({
  /** JSON Pointer path to array (e.g., "/items") */
  path: z.string(),
  /** Index to remove, or filter function identifier */
  index: z.number().optional(),
  /** Item ID or value to match for removal */
  match: z.unknown().optional(),
});

export type RemoveStateParams = z.infer<typeof RemoveStateParamsSchema>;

/**
 * Parameters for focus action.
 */
export const FocusParamsSchema = z.object({
  /** Widget ID to focus */
  id: z.string(),
});

export type FocusParams = z.infer<typeof FocusParamsSchema>;

/**
 * Parameters for toast action.
 */
export const ToastParamsSchema = z.object({
  /** Unique toast identifier */
  id: z.string(),
  /** Toast message */
  message: z.string(),
  /** Toast type: info, success, warning, error */
  type: z.enum(["info", "success", "warning", "error"]),
  /** Auto-dismiss duration in ms (0 = persistent) */
  duration: z.number().optional(),
  /** Progress indicator (0-100) */
  progress: z.number().optional(),
});

export type ToastParams = z.infer<typeof ToastParamsSchema>;

/**
 * Parameters for navigate action.
 */
export const NavigateParamsSchema = z.object({
  /** Route path to navigate to */
  path: z.string(),
  /** Route parameters */
  params: z.record(z.string(), z.unknown()).optional(),
});

export type NavigateParams = z.infer<typeof NavigateParamsSchema>;

/**
 * Parameters for quit action.
 */
export const QuitParamsSchema = z.object({
  /** Exit code (default: 0) */
  code: z.number().optional(),
  /** Optional message to display before quitting */
  message: z.string().optional(),
});

export type QuitParams = z.infer<typeof QuitParamsSchema>;

// =============================================================================
// Action Context
// =============================================================================

/**
 * Context passed to action handlers.
 * Provides access to state store and callbacks for terminal-specific operations.
 */
export interface ActionContext {
  /** The state store for read/write operations */
  store: StateStore;
  /** Callback to request focus on a widget ID */
  requestFocus?: (id: string) => void;
  /** Callback to add a toast to the toast state */
  addToast?: (toast: Toast) => void;
  /** Callback to quit/stop the application */
  quit?: (code?: number, message?: string) => void;
  /** Callback to navigate to a route */
  navigate?: (path: string, params?: Record<string, unknown>) => void;
  /** Debug mode flag */
  debug?: boolean;
}

/**
 * Action handler function type.
 */
export type ActionHandler<TParams = any> = (
  params: TParams,
  ctx: ActionContext
) => Promise<void> | void;

/**
 * Registry of action handlers.
 */
export type ActionHandlers = {
  [actionName: string]: ActionHandler<any>;
};

// =============================================================================
// Built-in Action Handlers
// =============================================================================

/**
 * setState action handler - updates state at a JSON Pointer path.
 *
 * @param params - Path and value to set
 * @param ctx - Action context with store access
 */
export const setStateHandler: ActionHandler<SetStateParams> = (
  params,
  ctx
) => {
  ctx.store.set(params.path, params.value);
};

/**
 * pushState action handler - appends an item to an array in state.
 *
 * @param params - Path to array and item to append
 * @param ctx - Action context with store access
 */
export const pushStateHandler: ActionHandler<PushStateParams> = (
  params,
  ctx
) => {
  const current = ctx.store.get(params.path);
  const arr = Array.isArray(current) ? current : [];


  ctx.store.set(params.path, [...arr, params.item]);
};

/**
 * removeState action handler - removes an item from an array in state.
 *
 * @param params - Path to array and removal criteria
 * @param ctx - Action context with store access
 */
export const removeStateHandler: ActionHandler<RemoveStateParams> = (
  params,
  ctx
) => {
  const current = ctx.store.get(params.path);
  if (!Array.isArray(current)) {
    return;
  }

  let newArr: unknown[];

  if (params.index !== undefined) {
    // Remove by index
    newArr = current.filter((_, i) => i !== params.index);
  } else if (params.match !== undefined) {
    // Remove by matching value
    newArr = current.filter((item) => item !== params.match);
  } else {
    return;
  }

  ctx.store.set(params.path, newArr);
};

/**
 * focus action handler - requests focus on a widget ID.
 *
 * @param params - Widget ID to focus
 * @param ctx - Action context with focus callback
 */
export const focusHandler: ActionHandler<FocusParams> = (params, ctx) => {

  if (ctx.requestFocus) {
    ctx.requestFocus(params.id);
  } else {
  }
};

/**
 * toast action handler - adds a toast notification.
 *
 * @param params - Toast configuration
 * @param ctx - Action context with toast callback
 */
export const toastHandler: ActionHandler<ToastParams> = (params, ctx) => {
  const toast: Toast = {
    id: params.id,
    message: params.message,
    type: params.type,
    duration: params.duration,
    progress: params.progress,
  };


  if (ctx.addToast) {
    ctx.addToast(toast);
  } else {
  }
};

/**
 * navigate action handler - navigates to a route.
 *
 * @param params - Route path and optional parameters
 * @param ctx - Action context with navigate callback
 */
export const navigateHandler: ActionHandler<NavigateParams> = (params, ctx) => {

  if (ctx.navigate) {
    ctx.navigate(params.path, params.params);
  } else {
  }
};

/**
 * quit action handler - stops the application.
 *
 * @param params - Exit code and optional message
 * @param ctx - Action context with quit callback
 */
export const quitHandler: ActionHandler<QuitParams> = (params, ctx) => {

  if (ctx.quit) {
    ctx.quit(params.code, params.message);
  } else {
  }
};

// =============================================================================
// Action Handler Factory
// =============================================================================

/**
 * Options for creating action handlers.
 */
export interface CreateActionHandlersOptions {
  /** Override built-in handlers with custom implementations */
  overrides?: Partial<ActionHandlers>;
  /** Debug mode flag */
  debug?: boolean;
}

/**
 * Create a registry of action handlers with optional overrides.
 *
 * @param options - Options including handler overrides
 * @returns Registry of action handlers
 *
 * @example
 * ```ts
 * const handlers = createActionHandlers({
 *   overrides: {
 *     customAction: async (params, ctx) => {
 *       // Custom action logic
 *     },
 *   },
 * });
 * ```
 */
export function createActionHandlers(
  options: CreateActionHandlersOptions = {}
): ActionHandlers {
  const { overrides = {}, debug = false } = options;

  // Base handlers with debug context wrapper
  const baseHandlers: ActionHandlers = {
    setState: setStateHandler,
    pushState: pushStateHandler,
    removeState: removeStateHandler,
    focus: focusHandler,
    toast: toastHandler,
    navigate: navigateHandler,
    quit: quitHandler,
  };

  const filteredEntries = Object.entries(overrides).filter(
    (entry): entry is [string, ActionHandler<any>] => entry[1] !== undefined
  );
  const mergedHandlers: Record<string, ActionHandler<any>> = {
    ...baseHandlers,
    ...Object.fromEntries(filteredEntries),
  };

  if (debug) {
    for (const [name, handler] of Object.entries(mergedHandlers)) {
      if (handler) {
        mergedHandlers[name] = wrapWithDebug(handler, name, true);
      }
    }
  }

  return mergedHandlers as ActionHandlers;
}


/**
 * Wrap a handler with debug logging.
 */
function wrapWithDebug<TParams>(
  handler: ActionHandler<TParams>,
  _name: string,
  debug: boolean
): ActionHandler<TParams> {
  if (!debug) return handler;


  return async (params, ctx) => {

    try {
      await handler(params, ctx);

    } catch (error) {
      throw error;
    }
  };
}
// =============================================================================
// Default Action Handlers Export
// =============================================================================

/**
 * Default action handlers registry.
 * Use createActionHandlers() for customization.
 */
export const defaultActionHandlers: ActionHandlers = createActionHandlers();

// =============================================================================
// Action Executor
// =============================================================================

/**
 * Execute an action by name with the given parameters.
 *
 * @param actionName - Name of the action to execute
 * @param params - Parameters for the action
 * @param handlers - Registry of action handlers
 * @param ctx - Action context
 * @throws Error if action handler is not found
 */
export async function executeAction(
  actionName: string,
  params: unknown,
  handlers: ActionHandlers,
  ctx: ActionContext
): Promise<void> {
  const handler = handlers[actionName];

  if (!handler) {
    throw new Error(`Unknown action: "${actionName}"`);
  }

  await handler(params, ctx);
}

// =============================================================================
// Re-export Toast type for convenience
// =============================================================================

export type { Toast } from "@rezi-ui/core";
