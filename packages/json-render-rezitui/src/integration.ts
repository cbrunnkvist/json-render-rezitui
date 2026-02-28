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
import type { ComputedFunction } from "./props.js";
import { defaultComponents } from "./defaults.js";
import { logDebug } from "./logger.js";

export { useRenderer, setRendererContext };

/**
 * Options for creating a Rezi app with JSON spec rendering.
 */
export interface CreateReziAppOptions<S extends StateModel = StateModel> {
  initialState: S;
  components?: ReziComponents;
  actionHandlers?: ActionHandlers;
  spec?: Spec;
  config?: NodeAppConfig;
  theme?: Theme | ThemeDefinition;
  routes?: readonly RouteDefinition<S>[];
  initialRoute?: string;
  hotReload?: NodeAppHotReloadOptions<S>;
  functions?: Record<string, ComputedFunction>;
  debug?: boolean;
  wrapView?: (vnode: VNode | null, state: Readonly<S>) => VNode | null;
}

/**
 * Extended app instance.
 */
export interface ReziApp<S extends StateModel = StateModel> extends NodeApp<S> {
  renderer: ReziRenderer;
  setSpec: (spec: Spec | null) => void;
  getSpec: () => Spec | null;
}

/**
 * Create a fully-wired Rezi app with JSON spec rendering.
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
    functions,
    debug = false,
    wrapView,
  } = options;

  let isRunning = false;
  let currentSpec: Spec | null = spec ?? null;
  let mergedComponents: ReziComponents = { ...components };

  const nodeApp = createNodeApp<S>({
    initialState,
    config,
    theme,
    routes,
    initialRoute,
    hotReload,
  });

  const mergedActionHandlers: ActionHandlers = createActionHandlers({
    overrides: actionHandlers,
    debug,
  });

  const renderer = new ReziRenderer({
    components: mergedComponents,
    actionHandlers: mergedActionHandlers,
    functions,
    debug,
    quit: (code) => {
      logDebug(true, "[ReziApp] Action quit requested", code);
      app.stop();
    },
    navigate: (path, params) => {
      logDebug(debug, "[ReziApp] Navigating to", path, params);
    },
    requestFocus: (id) => {
      logDebug(debug, "[ReziApp] Requesting focus for", id);
    }
  });

  // Default quit keybinding
  nodeApp.keys({
    "ctrl+c": () => {
      logDebug(true, "[ReziApp] Ctrl+C pressed");
      app.stop();
    },
  });

  if (spec) {
    renderer.setSpec(spec);
  }

  const createViewFn = (): ((state: Readonly<S>) => VNode) => {
    return (state: Readonly<S>) => {
      setRendererContext(renderer);
      try {
        let vnode = renderer.render();
        if (wrapView) {
          vnode = wrapView(vnode, state);
        }
        return vnode ?? ui.text("No content");
      } catch (error) {
        logDebug(true, "[ReziApp] Render error:", error);
        return ui.text("Render error");
      } finally {
        setRendererContext(null);
      }
    };
  };

  if (!routes) {
    nodeApp.view(createViewFn());
  }

  // When the renderer's internal state changes, force Rezi to re-render
  // by bumping a tick counter. A simple `s => s` identity update is a no-op
  // in Rezi (same reference === no dirty flag), so we must produce a new
  // state object.
  renderer.subscribe(() => {
    if (isRunning) {
      nodeApp.update((s) => ({ ...s, __renderTick: ((s as any).__renderTick ?? 0) + 1 }));
    }
  });

  // Attach extensions
  const app = nodeApp as unknown as ReziApp<S>;
  app.renderer = renderer;

  const originalStop = nodeApp.stop.bind(nodeApp);
  let stopResolve: (() => void) | null = null;
  let isStopping = false;

  const doStop = async () => {
    if (isStopping) return;
    isStopping = true;
    logDebug(true, "[ReziApp] Stopping...");
    try {
      await originalStop();
    } catch {
      // Ignore errors during stop (e.g. already stopped)
    }
    isRunning = false;
    if (stopResolve) {
      const resolve = stopResolve;
      stopResolve = null;
      resolve();
    }
  };

  app.run = async () => {
    isRunning = true;
    isStopping = false;
    logDebug(true, "[ReziApp] Starting app");

    nodeApp.onEvent((ev) => {
      if (ev.kind === "fatal") {
        logDebug(true, `[ReziApp] FATAL ERROR: ${ev.code} - ${ev.detail}`);
      }
    });

    // Use start() + manual signal handling instead of Rezi's run(),
    // which can resolve prematurely in some configurations.
    await nodeApp.start();

    // Block until stop() is called or a signal is received
    return new Promise<void>((resolve) => {
      // Keep the Node.js event loop alive — signal handlers alone don't
      // prevent the process from exiting when there are no other active handles.
      const keepAlive = setInterval(() => { }, 60_000);

      stopResolve = () => {
        clearInterval(keepAlive);
        for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
          process.removeListener(sig, onSignal);
        }
        logDebug(true, "[ReziApp] App stopped");
        resolve();
      };

      const onSignal = () => {
        logDebug(true, "[ReziApp] Signal received");
        doStop();
      };

      for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
        process.on(sig, onSignal);
      }
    });
  };

  app.stop = async () => {
    logDebug(true, "[ReziApp] Stop called");
    await doStop();
  };

  app.setSpec = (newSpec: Spec | null) => {
    currentSpec = newSpec;
    renderer.setSpec(newSpec);
    if (hotReload && !routes) {
      nodeApp.replaceView(createViewFn());
    }
    if (isRunning) {
      nodeApp.update((s) => ({ ...s, __renderTick: ((s as any).__renderTick ?? 0) + 1 }));
    }
  };

  app.getSpec = () => currentSpec;

  return app;
}

export interface CreateStreamingReziAppOptions<S extends StateModel = StateModel>
  extends Omit<CreateReziAppOptions<S>, "spec"> {
  onSpecUpdate?: (spec: Spec) => void;
}

export function createStreamingReziApp<S extends StateModel = StateModel>(
  options: CreateStreamingReziAppOptions<S>
): ReziApp<S> {
  const { onSpecUpdate, ...restOptions } = options;
  const app = createReziApp<S>(restOptions);

  if (onSpecUpdate) {
    const originalSetSpec = app.setSpec;
    app.setSpec = (spec: Spec | null) => {
      originalSetSpec(spec);
      if (spec) onSpecUpdate(spec);
    };
  }

  return app;
}

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

export function mergeComponents(
  ...registries: ReziComponents[]
): ReziComponents {
  return Object.assign({}, ...registries);
}
