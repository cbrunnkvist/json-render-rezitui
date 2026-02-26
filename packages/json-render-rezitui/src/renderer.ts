import { setRendererContext } from "./context.js";


import type { Spec, UIElement, StateStore, StateModel, ActionBinding } from "@json-render/core";
import { createStateStore, getByPath } from "@json-render/core";
import { ui, type VNode } from "@rezi-ui/core";
import type { ReziComponents, ReziComponentContext, EventHandle } from "./types.js";
import { evaluateVisibility, createVisibilityContext, type VisibilityCondition } from "./visibility.js";
import { executeAction, type ActionHandlers } from "./actions.js";
import { createPropResolutionContext, resolveActionParam } from "./props.js";

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
  /** Current element key path for ID generation */
  elementKey?: string;
  spec: Spec;
  components: ReziComponents;
  state: StateModel;
  debug: boolean;
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
  /** Flag to track if we're currently in render phase */
  private inRender = false;
  /** Queue of pending state updates to apply after render */
  private pendingUpdates: Array<{ path: string; value: unknown }> = [];
  /** Store unsubscribe function */
  private storeUnsubscribe?: () => void;

  constructor(options: ReziRendererOptions = {}) {
    this.store = options.store ?? createStateStore(options.initialState ?? {});
    this.components = options.components ?? {};
    this.debug = options.debug ?? false;
    this.onStateChange = options.onStateChange;
    this.actionHandlers = options.actionHandlers ?? {};

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
    this.spec = spec;
    
    // Initialize state from spec if provided
    if (spec?.state) {
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
    if (this.inRender) {
      // Queue update for after render
      this.pendingUpdates.push({ path, value });
      return;
    }
    this.store.set(path, value);
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
      return null;
    }

    // Get the component renderer for this type
    const componentFn = ctx.components[element.type];

    if (!componentFn) {
      // No renderer registered - try built-in mappings
      const builtinVNode = this.renderBuiltinElement(element, ctx);
      if (builtinVNode) {
        return builtinVNode;
      }

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
        const propCtx = createPropResolutionContext(
          this.store.getSnapshot(),
          ctx.repeatItem,
          ctx.repeatIndex
        );
        const resolved: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(b.params)) {
          resolved[key] = resolveActionParam(val, propCtx);
        }
        await this.executeActionBinding(b, resolved);
      }
    };

    // Create on function that returns an EventHandle with metadata
    const on = (eventName: string): EventHandle => {
      const binding = onBindings?.[eventName];
      if (!binding) {
        return { emit: () => {}, shouldPreventDefault: false, bound: false };
      }
      const actionBindings = Array.isArray(binding) ? binding : [binding];
      const shouldPreventDefault = actionBindings.some((b) => b.preventDefault);
      return {
        emit: () => emit(eventName),
        shouldPreventDefault,
        bound: true,
      };
    };
    // Create component context
    const componentCtx: ReziComponentContext = {
      props: element.props,
      children,
      emit: (event: string, params?: unknown) => {
        emit(event, params);
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
    await executeAction(
      binding.action,
      params,
      this.actionHandlers,
      {
        store: this.store,
        debug: this.debug,
      }
    );
  }

  /**
   * Render built-in Rezi widget types directly.
   * Provides default mappings for common widgets.
   */
  private renderBuiltinElement(element: UIElement, ctx: RenderContext): VNode | null {
    const props = element.props as Record<string, unknown>;
    const children = this.renderChildren(element, ctx);

    switch (element.type) {
      case "Text":
      case "text": {
        const content = (props?.content ?? props?.text ?? "") as string;
        return ui.text(content);
      }

      case "Box":
      case "box": {
        return ui.box(props as Record<string, unknown>, children);
      }

      case "Row":
      case "row":
      case "HStack":
      case "hstack": {
        return ui.row(props as Record<string, unknown>, children);
      }

      case "Column":
      case "column":
      case "VStack":
      case "vstack": {
        return ui.column(props as Record<string, unknown>, children);
      }
      case "Button":
      case "button": {
        // Use element key for deterministic ID if no explicit ID provided
        // Use element key for deterministic ID if no explicit ID provided
        const buttonId = props?.id 
          ? (props.id as string)
          : (ctx.elementKey ? `${ctx.elementKey}--button` : "button");
        const label = (props?.label ?? props?.text ?? "Button") as string;
        return ui.button(buttonId, label, props as Record<string, unknown>);
      }
      case "Input":
      case "input": {
        // Use element key for deterministic ID if no explicit ID provided
        // Use element key for deterministic ID if no explicit ID provided
        const inputId = props?.id 
          ? (props.id as string)
          : (ctx.elementKey ? `${ctx.elementKey}--input` : "input");
        const value = (props?.value ?? "") as string;
        return ui.input(inputId, value, props as Record<string, unknown>);
      }

      case "Spacer":
      case "spacer": {
        return ui.spacer(props as Record<string, unknown>);
      }

      case "Divider":
      case "divider": {
        return ui.divider(props as Record<string, unknown>);
      }

      default:
        return null;
    }
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
      // Create child context with updated element key
      // Create child context with updated element key
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
