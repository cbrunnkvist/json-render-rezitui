import type { StateModel } from "@json-render/core";
import type { ReziComponents, ReziActions } from "./types.js";
import type { ActionHandlers } from "./actions.js";
import { ReziRenderer, type ReziRendererOptions } from "./renderer.js";
import { defaultComponents } from "./defaults.js";

/**
 * Rezi component catalog type.
 * Maps component names to their prop types.
 */
export type ReziCatalog = {
  components: Record<string, { props: unknown }>;
  actions?: Record<string, unknown>;
};

/**
 * Options for defineReziRegistry.
 */
export interface DefineReziRegistryOptions<C extends ReziCatalog> {
  /** Custom components to register (merged with defaults) */
  components?: ReziComponents;
  /** Custom actions to register */
  actions?: ReziActions;
  /** Default state for the renderer */
  initialState?: StateModel;
  /** Debug mode */
  debug?: boolean;
}

/**
 * Result of defineReziRegistry.
 */
export interface DefineReziRegistryResult {
  /** Merged component registry (defaults + custom) */
  components: ReziComponents;
  /** Action handlers registry */
  actions: ActionHandlers;
  /** Create a new ReziRenderer instance with the registry */
  createRenderer: (options?: Partial<ReziRendererOptions>) => ReziRenderer;
}

/**
 * Create a type-safe registry from a catalog with custom components and actions.
 *
 * Merges user-provided components with default components, allowing overrides.
 *
 * @example
 * ```ts
 * const catalog = {
 *   components: {
 *     Text: { props: { content: "" } },
 *     Button: { props: { label: "", onPress: {} } },
 *   },
 *   actions: {
 *     navigate: { path: "" },
 *   },
 * } as const;
 *
 * const { components, actions, createRenderer } = defineReziRegistry(catalog, {
 *   components: {
 *     // Override default Button
 *     Button: (ctx) => ui.button({ label: ctx.props.label }),
 *   },
 *   actions: {
 *     navigate: async (params, setState) => { ... },
 *   },
 * });
 *
 * const renderer = createRenderer();
 * ```
 */
export function defineReziRegistry<C extends ReziCatalog>(
  _catalog: C,
  options: DefineReziRegistryOptions<C> = {}
): DefineReziRegistryResult {
  // Merge user components with defaults (user overrides default)
  const mergedComponents: ReziComponents = {
    ...defaultComponents,
    ...options.components,
  };

  // Convert actions to action handlers
  const actionHandlers: ActionHandlers = {};
  if (options.actions) {
    for (const [key, actionFn] of Object.entries(options.actions)) {
      actionHandlers[key] = async (params, ctx) => {
        await actionFn(
          params,
          (updater) => {
            const prev = ctx.store.getSnapshot();
            const next = updater(prev);
            ctx.store.update(next);
          },
          ctx.store.getSnapshot()
        );
      };
    }
  }

  // Create renderer factory
  const createRenderer = (rendererOptions?: Partial<ReziRendererOptions>): ReziRenderer => {
    return new ReziRenderer({
      components: mergedComponents,
      actionHandlers,
      initialState: options.initialState,
      debug: options.debug,
      ...rendererOptions,
    });
  };

  return {
    components: mergedComponents,
    actions: actionHandlers,
    createRenderer,
  };
}

/**
 * Merge multiple component registries.
 * Earlier registries take precedence over later ones.
 *
 * @example
 * ```ts
 * const merged = mergeRegistries(
 *   baseComponents,
 *   themeComponents,
 *   customComponents // Highest priority
 * );
 * ```
 */
export function mergeRegistries(...registries: ReziComponents[]): ReziComponents {
  return registries.reduce((acc, registry) => ({
    ...acc,
    ...registry,
  }), {});
}
