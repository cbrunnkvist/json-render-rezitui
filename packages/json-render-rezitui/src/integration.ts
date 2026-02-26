import {
  createNodeApp,
  type NodeApp,
  type NodeAppConfig,
  type NodeAppHotReloadOptions,
} from "@rezi-ui/node";
import { useRenderer, setRendererContext } from "./context.js";
import type { Theme, ThemeDefinition, RouteDefinition, VNode } from "@rezi-ui/core";
import { ui } from "@rezi-ui/core";
import type { Spec, StateModel } from "@json-render/core";
import {
  ReziRenderer,
} from "./renderer.js";
import type { ReziComponents, ReziComponentFn } from "./types.js";
import type { ActionHandlers } from "./actions.js";
import { createActionHandlers } from "./actions.js";

// Import all components for default registry
import { Box, Row, Column } from "./components/layout.js";
import {
  Text,
  Button,
  Input,
  Select,
  Checkbox,
  Slider,
} from "./components/interactive.js";
import { Page, Panel, Table, VirtualList, Logs } from "./components/advanced.js";
import {
  Modal,
  Dialog,
  Dropdown,
  CommandPalette,
} from "./components/overlays.js";
import {
  CodeEditor,
  DiffViewer,
  Canvas,
  LineChart,
  BarChart,
  Gauge,
} from "./components/visualization.js";

// =============================================================================
// Default Components Registry
// =============================================================================

/**
 * Default component registry with all built-in components.
 * Includes layout, interactive, advanced, overlay, and visualization components.
 */
export const defaultComponents: ReziComponents = {
  // Layout
  Box,
  Row,
  Column,
  HStack: Row, // Alias
  VStack: Column, // Alias

  // Interactive
  Text,
  Button,
  Input,
  Select,
  Checkbox,
  Slider,

  // Advanced
  Page,
  Panel,
  Table,
  VirtualList,
  Logs,

  // Overlays
  Modal,
  Dialog,
  Dropdown,
  CommandPalette,

  // Visualization
  CodeEditor,
  DiffViewer,
  Canvas,
  LineChart,
  BarChart,
  Gauge,
};
export { useRenderer, setRendererContext };


// =============================================================================
// Create Rezi App Options
// =============================================================================

/**
 * Options for creating a Rezi app with JSON spec rendering.
 */
export interface CreateReziAppOptions<S extends StateModel = StateModel> {
  /** Initial application state */
  initialState: S;
  /** Component registry (defaults to defaultComponents) */
  components?: ReziComponents;
  /** Action handlers (defaults to built-in handlers) */
  actionHandlers?: ActionHandlers;
  /** Initial JSON spec to render */
  spec?: Spec;
  /** App configuration (fpsCap, etc.) */
  config?: NodeAppConfig;
  /** Theme or theme definition */
  theme?: Theme | ThemeDefinition;
  /** Routes for multi-screen apps */
  routes?: readonly RouteDefinition<S>[];
  /** Initial route */
  initialRoute?: string;
  /** Hot reload options for development */
  hotReload?: NodeAppHotReloadOptions<S>;
  /** Debug mode */
  debug?: boolean;
  /** Custom view wrapper - receives the rendered VNode and can modify it */
  wrapView?: (vnode: VNode | null, state: Readonly<S>) => VNode | null;
  /** Callback when an action needs to quit the app */

}

/**
 * Extended app instance returned by createReziApp.
 * Combines NodeApp with renderer access.
 */
export interface ReziApp<S extends StateModel = StateModel> extends NodeApp<S> {
  /** The underlying ReziRenderer instance */
  renderer: ReziRenderer;
  /** Update the JSON spec to render */
  setSpec: (spec: Spec | null) => void;
  /** Get the current JSON spec */
  getSpec: () => Spec | null;
  /** Register additional components */
  registerComponents: (components: ReziComponents) => void;
  /** Register additional action handlers */
  registerActionHandlers: (handlers: ActionHandlers) => void;
}

// =============================================================================
// Create Rezi App
// =============================================================================

/**
 * Create a fully-wired Rezi app with JSON spec rendering.
 *
 * This function combines:
 * - `createNodeApp()` from @rezi-ui/node for terminal I/O
 * - `ReziRenderer` for JSON spec to VNode rendering
 * - Auto-wiring of view function to renderer.render()
 * - Optional hot reload integration
 *
 * @param options - Configuration options
 * @returns App instance with renderer access
 *
 * @example
 * ```ts
 * import { createReziApp, defaultComponents } from "json-render-rezitui";
 *
 * // Create app with initial state
 * const app = createReziApp({
 *   initialState: { user: null, items: [] },
 *   components: defaultComponents,
 *   config: { fpsCap: 30 },
 * });
 *
 * // Set spec from AI response
 * app.setSpec(spec);
 *
 * // Run the app
 * await app.run();
 * ```
 *
 * @example
 * ```ts
 * // With hot reload for development
 * const app = createReziApp({
 *   initialState: {},
 *   components: defaultComponents,
 *   hotReload: {
 *     viewModule: "./view.ts",
 *   },
 * });
 * ```
 */
export function createReziApp<S extends StateModel = StateModel>(
  options: CreateReziAppOptions<S>
): ReziApp<S> {
  const {
    initialState,
    components = defaultComponents,
    actionHandlers,
    spec,
    config,
    theme,
    routes,
    initialRoute,
    hotReload,
    debug = false,
    wrapView,
  } = options;

  // Create merged component registry
  let mergedComponents: ReziComponents = { ...components };

  // Create action handlers with callbacks
  const mergedActionHandlers: ActionHandlers = createActionHandlers({
    overrides: actionHandlers,
    debug,
  });

  // Create the renderer
  const renderer = new ReziRenderer({
    components: mergedComponents,
    actionHandlers: mergedActionHandlers,
    debug,
  });

  // Set initial spec if provided
  if (spec) {
    renderer.setSpec(spec);
  }

  // Create the NodeApp
  const nodeApp = createNodeApp<S>({
    initialState,
    config,
    theme,
    routes,
    initialRoute,
    hotReload,
  });

  // Track current spec
  let currentSpec: Spec | null = spec ?? null;

  // Create the view function
  const createViewFn = (): ((state: Readonly<S>) => VNode) => {
    return (state: Readonly<S>) => {
      // Set renderer context for useRenderer() hook
      setRendererContext(renderer);

      try {
        // Render the spec
        let vnode = renderer.render();

        // Apply wrapper if provided
        if (wrapView) {
          vnode = wrapView(vnode, state);
        }

        // Return vnode or fallback
        return vnode ?? ui.text("No content");
      } catch (error) {
        return ui.text("Render error");
      } finally {
        // Clear renderer context
        setRendererContext(null);
      }
    };
  };

  // Wire the view function
  if (!routes) {
    nodeApp.view(createViewFn());
  }

  // Subscribe renderer to state changes for re-render
  renderer.subscribe(() => {
    // State changed - the app will re-render on next frame
    // This is handled by Rezi's update mechanism
  });

  // Create the extended app interface
  const reziApp: ReziApp<S> = Object.create(nodeApp, {
    renderer: {
      value: renderer,
      enumerable: true,
      configurable: false,
      writable: false,
    },
    setSpec: {
      value: (newSpec: Spec | null) => {
        currentSpec = newSpec;
        renderer.setSpec(newSpec);

        // Trigger hot reload if configured
        if (hotReload && !routes) {
          nodeApp.replaceView(createViewFn());
        }
      },
      enumerable: true,
      configurable: false,
      writable: false,
    },
    getSpec: {
      value: () => currentSpec,
      enumerable: true,
      configurable: false,
      writable: false,
    },
    registerComponents: {
      value: (newComponents: ReziComponents) => {
        mergedComponents = { ...mergedComponents, ...newComponents };
        // Note: This doesn't update the existing renderer's components
        // A new renderer would need to be created for that
      },
      enumerable: true,
      configurable: false,
      writable: false,
    },
    registerActionHandlers: {
      value: (newHandlers: ActionHandlers) => {
        Object.assign(mergedActionHandlers, newHandlers);
      },
      enumerable: true,
      configurable: false,
      writable: false,
    },
  });

  return reziApp;
}

// =============================================================================
// Streaming App Helper
// =============================================================================

/**
 * Options for creating a streaming Rezi app.
 */
export interface CreateStreamingReziAppOptions<S extends StateModel = StateModel>
  extends Omit<CreateReziAppOptions<S>, "spec"> {
  /** Callback when spec is updated during streaming */
  onSpecUpdate?: (spec: Spec) => void;
}

/**
 * Create a Rezi app optimized for streaming AI responses.
 *
 * This is a convenience wrapper around createReziApp that sets up
 * the streaming renderer pattern for real-time UI updates.
 *
 * @param options - Configuration options
 * @returns App instance with streaming support
 *
 * @example
 * ```ts
 * import { createStreamingReziApp, defaultComponents } from "json-render-rezitui";
 *
 * const app = createStreamingReziApp({
 *   initialState: {},
 *   components: defaultComponents,
 * });
 *
 * // Process AI stream
 * for await (const chunk of aiStream) {
 *   app.renderer.setSpec(processChunk(chunk));
 * }
 *
 * await app.run();
 * ```
 */
export function createStreamingReziApp<S extends StateModel = StateModel>(
  options: CreateStreamingReziAppOptions<S>
): ReziApp<S> {
  const { onSpecUpdate, ...restOptions } = options;

  const app = createReziApp<S>(restOptions);

  // Subscribe to spec changes
  if (onSpecUpdate) {
    const originalSetSpec = app.setSpec;
    Object.defineProperty(app, "setSpec", {
      value: (spec: Spec | null) => {
        originalSetSpec(spec);
        if (spec) {
          onSpecUpdate(spec);
        }
      },
      enumerable: true,
      configurable: false,
      writable: false,
    });
  }

  return app;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Create a component that wraps another component with renderer access.
 *
 * Useful for creating higher-order components that need to interact
 * with the renderer context.
 *
 * @param component - The component to wrap
 * @param wrapper - Wrapper function that receives component result and renderer
 * @returns Wrapped component
 *
 * @example
 * ```ts
 * const EnhancedButton = withRenderer(Button, (vnode, renderer) => {
 *   const count = renderer.getState("/count");
 *   // Modify vnode or return new one
 *   return vnode;
 * });
 * ```
 */
export function withRenderer<P = Record<string, unknown>>(
  component: ReziComponentFn<P>,
  wrapper: (vnode: VNode, renderer: ReziRenderer) => VNode
): ReziComponentFn<P> {
  return (ctx) => {
    const vnode = component(ctx);
    const renderer = useRenderer();
    return wrapper(vnode, renderer);
  };
}

/**
 * Merge multiple component registries.
 *
 * @param registries - Component registries to merge
 * @returns Merged registry (later registries override earlier ones)
 *
 * @example
 * ```ts
 * const customComponents = mergeComponents(
 *   defaultComponents,
 *   { CustomWidget: myCustomWidget }
 * );
 * ```
 */
export function mergeComponents(
  ...registries: ReziComponents[]
): ReziComponents {
  return Object.assign({}, ...registries);
}
