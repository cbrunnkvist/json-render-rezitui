import { setRendererContext } from "./context.js";


import type { Spec, UIElement, StateStore, StateModel, ActionBinding } from "@json-render/core";
import { createStateStore, getByPath } from "@json-render/core";
import { ui, type VNode, type Toast } from "@rezi-ui/core";
import type { ReziComponents, ReziComponentContext, EventHandle } from "./types.js";
import { evaluateVisibility, createVisibilityContext, type VisibilityCondition } from "./visibility.js";
import { executeAction, type ActionHandlers } from "./actions.js";
import {
  createPropResolutionContext,
  resolveActionParam,
  resolveElementProps,
  resolveBindings,
  type ComputedFunction,
  type ReziPropResolutionContext,
} from "./props.js";
import { mapStyles } from "./styles.js";
import { defaultComponents } from "./defaults.js";
import { logDebug } from "./logger.js";

export type { ReziComponents } from "./types.js";

/**
 * Options for creating a ReziRenderer instance.
 */
export interface ReziRendererOptions {
  /** Component registry mapping component names to render functions */
  components?: ReziComponents;
  /** External state store (controlled mode). When provided, internal store is not created. */
  store?: StateStore;
  /** Initial state for the internal store (uncontrolled mode) */
  initialState?: StateModel;
  /** Callback fired when state changes - useful for triggering re-renders */
  onStateChange?: () => void;
  /** Enable debug logging */
  debug?: boolean;
  /** Action handlers registry for executing actions on events */
  actionHandlers?: ActionHandlers;
  /** Registered computed functions for $computed expressions */
  functions?: Record<string, ComputedFunction>;

  /** Callback to request focus on a widget ID */
  requestFocus?: (id: string) => void;
  /** Callback to add a toast notification */
  addToast?: (toast: Toast) => void;
  /** Callback to quit the application */
  quit?: (code?: number, message?: string) => void;
  /** Callback to navigate to a route */
  navigate?: (path: string, params?: Record<string, unknown>) => void;
}

/**
 * Context used during element rendering.
 * Passed to component render functions.
 */
interface RenderContext {
  /** Current repeat item (for repeat scopes) */
  repeatItem?: unknown;
  /** Current repeat index (for repeat scopes) */
  repeatIndex?: number;
  /** Absolute state path to the current repeat item (for repeat scopes) */
  repeatBasePath?: string;
  /** Current element key path for ID generation */
  elementKey?: string;
  spec: Spec;
  components: ReziComponents;
  state: StateModel;
  debug: boolean;
  functions: Record<string, ComputedFunction>;
}

/**
 * ReziRenderer renders JSON specs to Rezi VNode trees.
 *
 * @example
 * ```ts
 * const renderer = new ReziRenderer({
 *   components: {
 *     Text: (ctx) => ui.text(ctx.props.content as string),
 *     Box: (ctx) => ui.box({}, ctx.children),
 *   },
 * });
 *
 * renderer.setSpec(spec);
 * const vnode = renderer.render();
 * ```
 */
export class ReziRenderer {
  private spec: Spec | null = null;
  private store: StateStore;
  private components: ReziComponents;
  private debug: boolean;
  private onStateChange?: () => void;
  /** Action handlers registry for executing actions on events */
  private actionHandlers: ActionHandlers;
  /** Registered computed functions for $computed expressions */
  private functions: Record<string, ComputedFunction>;

  // Callbacks for actions
  private requestFocusCallback?: (id: string) => void;
  private addToastCallback?: (toast: Toast) => void;
  private quitCallback?: (code?: number, message?: string) => void;
  private navigateCallback?: (path: string, params?: Record<string, unknown>) => void;

  /** Flag to track if we're currently in render phase */
  private inRender = false;
  /** Queue of pending state updates to apply after render */
  private pendingUpdates: Array<{ path: string; value: unknown }> = [];
  /** Store unsubscribe function */
  private storeUnsubscribe?: () => void;

  constructor(options: ReziRendererOptions = {}) {
    this.store = options.store ?? createStateStore(options.initialState ?? {});
    this.components = options.components ?? defaultComponents;
    this.debug = options.debug ?? false;
    this.onStateChange = options.onStateChange;
    this.actionHandlers = options.actionHandlers ?? {};
    this.functions = options.functions ?? {};

    this.requestFocusCallback = options.requestFocus;
    this.addToastCallback = options.addToast;
    this.quitCallback = options.quit;
    this.navigateCallback = options.navigate;

    // Subscribe to store changes and forward to onStateChange callback
    this.storeUnsubscribe = this.store.subscribe(() => {
      this.onStateChange?.();
    });
  }

  /**
   * Set the spec to render.
   * @param spec - The JSON spec to render, or null to clear.
   */
  setSpec(spec: Spec | null): void {
    logDebug(this.debug, "setSpec", spec?.root ? `root: ${spec.root}` : "null");
    this.spec = spec;

    // Initialize state from spec if provided
    if (spec?.state) {
      logDebug(this.debug, "Initializing state from spec");
      this.store.update(spec.state);
    }
  }

  /**
   * Get a value from the state model by JSON Pointer path.
   * @param path - JSON Pointer path (e.g., "/user/name")
   * @returns The value at the path, or undefined if not found.
   */
  getState(path: string): unknown {
    return this.store.get(path);
  }

  /**
   * Set a value in the state model by JSON Pointer path.
   * Queues the update if called during render phase to avoid mutations during render.
   * @param path - JSON Pointer path (e.g., "/user/name")
   * @param value - The value to set.
   */
  setState(path: string, value: unknown): void {
    logDebug(this.debug, "setState", path, value);
    if (this.inRender) {
      logDebug(this.debug, "  Queuing state update (in render)");
      // Queue update for after render
      this.pendingUpdates.push({ path, value });
      return;
    }
    this.store.set(path, value);
  }

  /**
   * Set the callbacks for actions.
   */
  setCallbacks(callbacks: {
    requestFocus?: (id: string) => void;
    addToast?: (toast: Toast) => void;
    quit?: (code?: number, message?: string) => void;
    navigate?: (path: string, params?: Record<string, unknown>) => void;
  }): void {
    if (callbacks.requestFocus) this.requestFocusCallback = callbacks.requestFocus;
    if (callbacks.addToast) this.addToastCallback = callbacks.addToast;
    if (callbacks.quit) this.quitCallback = callbacks.quit;
    if (callbacks.navigate) this.navigateCallback = callbacks.navigate;
  }

  /**
   * Apply all pending state updates that were queued during render.
   * Called automatically after render completes.
   */
  private flushPendingUpdates(): void {
    if (this.pendingUpdates.length === 0) return;

    const updates = this.pendingUpdates;
    this.pendingUpdates = [];

    // Batch all updates into a single update call
    const updateMap: Record<string, unknown> = {};
    for (const { path, value } of updates) {
      updateMap[path] = value;
    }
    this.store.update(updateMap);

  }

  /**
   * Get the full state snapshot.
   * @returns The current state model.
   */
  getStateSnapshot(): StateModel {
    return this.store.getSnapshot();
  }

  /**
   * Render the current spec to a VNode tree.
   * @returns The root VNode, or null if no spec or root element.
   */
  render(): VNode | null {
    if (!this.spec || !this.spec.root) {
      return null;
    }

    const rootElement = this.spec.elements[this.spec.root];
    if (!rootElement) {
      return null;
    }

    const ctx: RenderContext = {
      spec: this.spec,
      components: this.components,
      state: this.store.getSnapshot(),
      debug: this.debug,
      elementKey: this.spec.root,
      functions: this.functions,
    };

    // Set inRender flag to catch mutations during render
    this.inRender = true;
    // Set renderer context for useRenderer() hook
    setRendererContext(this);
    try {
      return this.renderElement(rootElement, ctx);
    } finally {
      this.inRender = false;
      // Clear renderer context
      setRendererContext(null);
      // Flush any updates that were queued during render
      this.flushPendingUpdates();
    }
  }

  /**
   * Subscribe to state changes.
   * Returns an unsubscribe function.
   * @param listener - Callback to invoke when state changes.
   * @returns Unsubscribe function.
   */
  subscribe(listener: () => void): () => void {
    return this.store.subscribe(listener);
  }

  /**
   * Get the underlying state store.
   * Useful for advanced integrations that need direct store access.
   * @returns The StateStore instance.
   */
  getStore(): StateStore {
    return this.store;
  }

  /**
   * Dispose of the renderer and clean up subscriptions.
   * Call this when the renderer is no longer needed.
   */
  dispose(): void {
    if (this.storeUnsubscribe) {
      this.storeUnsubscribe();
      this.storeUnsubscribe = undefined;
    }
  }

  /**
   * Render a single UI element to a VNode.
   * @param element - The UI element to render.
   * @param ctx - The render context.
   * @returns The rendered VNode, or null if the element should not render.
   */
  private renderElement(element: UIElement, ctx: RenderContext): VNode | null {
    // Check visibility condition before rendering
    const visibilityCtx = createVisibilityContext(
      ctx.state,
      ctx.repeatItem,
      ctx.repeatIndex,
    );
    if (!evaluateVisibility(element.visible, visibilityCtx)) {
      logDebug(this.debug, `  Element "${element.type}" (${ctx.elementKey}) is hidden by visibility condition`);
      return null;
    }

    // Resolve props and bindings
    const propCtx = createPropResolutionContext(
      ctx.state,
      ctx.repeatItem,
      ctx.repeatIndex,
      ctx.repeatBasePath,
      ctx.functions
    );
    const resolvedProps = resolveElementProps(element.props ?? {}, propCtx);
    const resolvedBindings = resolveBindings(element.props ?? {}, propCtx);

    logDebug(this.debug, `  Rendering element "${element.type}" (${ctx.elementKey})`, { props: resolvedProps });

    // Get the component renderer for this type
    const componentFn = ctx.components[element.type];

    if (!componentFn) {
      logDebug(this.debug, `  [WARN] No component registered for type "${element.type}"`);
      return null;
    }

    // Render children first
    const children = this.renderChildren(element, ctx);

    // Get event bindings from element
    const onBindings = element.on;

    // Create emit function that resolves events to action bindings
    const emit = async (eventName: string, params?: unknown) => {
      const binding = onBindings?.[eventName];
      if (!binding) return;

      const actionBindings = Array.isArray(binding) ? binding : [binding];
      for (const b of actionBindings) {
        if (!b.params) {
          await this.executeActionBinding(b, {});
          continue;
        }

        // Build a fresh context with live store state so that $state
        // references in later actions see mutations from earlier ones.
        const currentPropCtx: ReziPropResolutionContext = {
          ...createPropResolutionContext(
            this.store.getSnapshot(),
            ctx.repeatItem,
            ctx.repeatIndex,
            ctx.repeatBasePath,
            ctx.functions
          ),
          event: params
        };
        const resolved: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(b.params)) {
          resolved[key] = resolveActionParam(val, currentPropCtx);
        }
        await this.executeActionBinding(b, resolved);
      }
    };

    // Create on function that returns an EventHandle with metadata
    const on = (eventName: string): EventHandle => {
      const binding = onBindings?.[eventName];
      if (!binding) {
        return { emit: () => { }, shouldPreventDefault: false, bound: false };
      }
      const actionBindings = Array.isArray(binding) ? binding : [binding];
      const shouldPreventDefault = actionBindings.some((b) => b.preventDefault);
      return {
        emit: (params?: unknown) => emit(eventName, params),
        shouldPreventDefault,
        bound: true,
      };
    };

    // Create component context
    const componentCtx: ReziComponentContext = {
      props: {
        ...resolvedProps,
        bindings: resolvedBindings,
      },
      children,
      emit: (event: string, params?: unknown) => {
        emit(event, params);
      },
      dispatchAction: async (actionName: string, params?: Record<string, unknown>) => {
        await this.executeActionBinding({ action: actionName }, params ?? {});
      },
      on,
      /** Generate a deterministic ID based on element key and suffix */
      id: (suffix: string): string => {
        const base = ctx.elementKey ?? "element";
        // Format: element-key--button or element-key--0--button (for repeats)
        const repeatPart = ctx.repeatIndex !== undefined ? `--${ctx.repeatIndex}` : "";
        return `${base}${repeatPart}--${suffix}`;
      },
    };

    try {
      return componentFn(componentCtx);
    } catch (error) {
      if (this.debug) console.error(`Error rendering component "${element.type}":`, error);
      return null;
    }
  }

  /**
   * Execute an action binding with the given parameters.
   * @param binding - The action binding to execute
   * @param params - The resolved parameters for the action
   */
  private async executeActionBinding(
    binding: ActionBinding,
    params: Record<string, unknown>
  ): Promise<void> {
    logDebug(this.debug, "Executing action", binding.action, params);
    await executeAction(
      binding.action,
      params,
      this.actionHandlers,
      {
        store: this.store,
        debug: this.debug,
        requestFocus: this.requestFocusCallback,
        addToast: this.addToastCallback,
        quit: this.quitCallback,
        navigate: this.navigateCallback,
      }
    );
  }

  /**
   * Render child elements.
   * @param element - The parent element containing children.
   * @param ctx - The render context.
   * @returns Array of rendered child VNodes.
   */
  private renderChildren(element: UIElement, ctx: RenderContext): VNode[] {
    if (!element.children || element.children.length === 0) {
      return [];
    }

    const childNodes: VNode[] = [];
    for (const childKey of element.children) {
      const childElement = this.spec?.elements?.[childKey];
      if (!childElement) continue;

      // Handle 'repeat' property
      if (childElement.repeat) {
        const repeatPath = typeof childElement.repeat === "string"
          ? childElement.repeat
          : (childElement.repeat as any).$state; // Simple support for {$state: "..."}

        if (repeatPath) {
          const repeatData = this.getState(repeatPath);
          if (Array.isArray(repeatData)) {
            repeatData.forEach((item, index) => {
              const childCtx: RenderContext = {
                ...ctx,
                elementKey: `${ctx.elementKey ?? ""}--${childKey}--${index}`,
                repeatItem: item,
                repeatIndex: index,
                repeatBasePath: `${repeatPath}/${index}`,
              };
              const childVNode = this.renderElement(childElement, childCtx);
              if (childVNode) {
                childNodes.push(childVNode);
              }
            });
            continue; // Move to next childKey
          }
        }
      }

      // Normal single element render
      const childCtx: RenderContext = {
        ...ctx,
        elementKey: ctx.elementKey ? `${ctx.elementKey}--${childKey}` : childKey,
      };
      const childVNode = this.renderElement(childElement, childCtx);
      if (childVNode) {
        childNodes.push(childVNode);
      }
    }

    return childNodes;
  }
}

/**
 * Create a ReziRenderer with the given options.
 * Convenience function for one-liner instantiation.
 *
 * @example
 * ```ts
 * const renderer = createRenderer({
 *   components: {
 *     Text: (ctx) => ui.text(ctx.props.content as string),
 *   },
 * });
 * ```
 */
export function createRenderer(options: ReziRendererOptions = {}): ReziRenderer {
  return new ReziRenderer(options);
}
