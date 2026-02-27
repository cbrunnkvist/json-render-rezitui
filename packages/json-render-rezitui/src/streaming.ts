import {
  createSpecStreamCompiler,
  type Spec,
  type SpecStreamLine,
} from "@json-render/core";
import { ui, type VNode } from "@rezi-ui/core";
import {
  ReziRenderer,
  type ReziComponents,
} from "./renderer.js";
import type { ActionHandlers } from "./actions.js";

/**
 * Options for creating a streaming renderer.
 */
export interface StreamingRendererOptions {
  /** Rezi App instance for hot reload integration */
  app?: StreamingAppAdapter;
  /** Component registry mapping component names to render functions */
  components?: ReziComponents;
  /** Action handlers registry for executing actions on events */
  actionHandlers?: ActionHandlers;
  /** Initial spec to start with (optional) */
  initialSpec?: Partial<Spec>;
  /** Callback fired when spec is updated during streaming */
  onSpecUpdate?: (spec: Spec, patches: SpecStreamLine[]) => void;
  /** Callback fired when an error occurs during streaming */
  onError?: (error: Error, chunk?: string) => void;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Minimal adapter interface for Rezi App hot reload integration.
 * Only requires the methods needed for streaming updates.
 */
export interface StreamingAppAdapter {
  /** Replace the view function for hot reload */
  replaceView(fn: () => VNode): void;
  /** Update application state */
  update: (updater: unknown | ((prev: unknown) => unknown)) => void;
}

/**
 * Result of pushing a chunk to the streaming renderer.
 */
export interface StreamingPushResult {
  /** Current compiled spec */
  spec: Spec;
  /** Patches applied in this push */
  newPatches: SpecStreamLine[];
  /** Whether the spec is valid for rendering */
  isValid: boolean;
  /** Validation errors if spec is invalid */
  errors?: string[];
}

/**
 * Streaming renderer that wraps ReziRenderer with SpecStream support.
 *
 * Provides progressive rendering as AI generates spec patches line by line.
 * Integrates with Rezi's hot reload hooks for real-time UI updates.
 *
 * @example
 * ```ts
 * const streaming = createStreamingRenderer({
 *   app,
 *   components: defaultComponents,
   onSpecUpdate: (spec, patches) => {},
 * });
 *
 * // Process streaming response
 * const reader = response.body.getReader();
 * const decoder = new TextDecoder();
 *
 * while (true) {
 *   const { done, value } = await reader.read();
 *   if (done) break;
 *
 *   const { spec, isValid } = streaming.push(decoder.decode(value));
 *   if (isValid) {
 *     // UI already updated via app.replaceView()
 *   }
 * }
 * ```
 */
export interface StreamingRenderer {
  /** Push a chunk of streaming data */
  push(chunk: string): StreamingPushResult;
  /** Get the current compiled spec */
  getSpec(): Spec;
  /** Get all patches that have been applied */
  getPatches(): SpecStreamLine[];
  /** Reset the renderer to initial state */
  reset(initialSpec?: Partial<Spec>): void;
  /** Render the current spec to a VNode */
  render(): VNode | null;
  /** Get the underlying ReziRenderer */
  getRenderer(): ReziRenderer;
  /** Dispose of the renderer and clean up resources */
  dispose(): void;
}

/**
 * Default empty spec structure.
 */
const EMPTY_SPEC: Spec = {
  root: "",
  elements: {},
  state: {},
};

/**
 * Validate a partial spec for renderability.
 * Returns { isValid, errors } tuple.
 */
function validatePartialSpec(spec: Spec): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for root element
  if (!spec.root) {
    errors.push("Missing root element key");
  }

  // Check that root element exists
  if (spec.root && !spec.elements[spec.root]) {
    errors.push(`Root element "${spec.root}" not found in elements`);
  }

  // Check for orphaned children (children referencing non-existent elements)
  for (const [key, element] of Object.entries(spec.elements)) {
    if (element.children) {
      for (const childKey of element.children) {
        if (!spec.elements[childKey]) {
          errors.push(`Element "${key}" references missing child "${childKey}"`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0 && !!spec.root,
    errors,
  };
}

/**
 * Create a streaming renderer that wraps ReziRenderer with SpecStream support.
 *
 * The streaming renderer:
 * - Uses `createSpecStreamCompiler` to progressively build specs from JSONL patches
 * - Wraps `ReziRenderer` for VNode rendering
 * - Integrates with Rezi's `app.replaceView()` for hot reload
 * - Handles partial/invalid specs gracefully during streaming
 *
 * @param options - Configuration options
 * @returns StreamingRenderer instance
 *
 * @example
 * ```ts
 * import { createStreamingRenderer, defaultComponents } from "@cbrunnkvist/json-render-rezitui";
 * import { createNodeApp } from "@rezi-ui/node";
 *
 * const app = createNodeApp({ initialState: {} });
 *
 * const streaming = createStreamingRenderer({
 *   app,
 *   components: defaultComponents,
 *   onSpecUpdate: (spec, patches) => {

 *   },
 * });
 *
 * // Set up view function
 * app.view(() => streaming.render() ?? ui.text("Loading..."));
 * await app.run();
 * ```
 */
export function createStreamingRenderer(
  options: StreamingRendererOptions = {},
): StreamingRenderer {
  const {
    app,
    components,
    actionHandlers,
    initialSpec,
    onSpecUpdate,
    onError,
    debug = false,
  } = options;

  // Create the SpecStream compiler
  const compiler = createSpecStreamCompiler<Spec>(initialSpec ?? EMPTY_SPEC);

  // Create the underlying ReziRenderer
  const renderer = new ReziRenderer({
    components,
    actionHandlers,
    debug,
    onStateChange: () => {
      // State changed - could trigger re-render if needed
    },
  });

  /**
   * Create a view function for the Rezi app.
   */
  function createViewFn(): () => VNode {
    return () => {
      try {
        return renderer.render() ?? ui.text("");
      } catch (error) {
        return ui.text("");
      }
    };
  }

  /**
   * Update the app's view function for hot reload.
   */
  function updateAppView(): void {
    if (app && typeof app.replaceView === "function") {
      try {
        app.replaceView(createViewFn());
      } catch (error) {
      }
    }
  }

  // Track if we've set up the initial view
  let viewInitialized = false;

  return {
    push(chunk: string): StreamingPushResult {
      try {
        // Push chunk to compiler
        const { result, newPatches } = compiler.push(chunk);

        // Validate the partial spec
        const { isValid, errors } = validatePartialSpec(result);


        // Update renderer with new spec (even if invalid - it may be partially renderable)
        if (newPatches.length > 0) {
          try {
            renderer.setSpec(result);
          } catch (error) {
            // Continue even if setSpec fails - spec may be partially valid
          }

          // Update app view for hot reload
          if (!viewInitialized) {
            viewInitialized = true;
            updateAppView();
          }

          // Fire callback
          onSpecUpdate?.(result, newPatches);
        }

        return {
          spec: result,
          newPatches,
          isValid,
          errors: errors.length > 0 ? errors : undefined,
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        onError?.(err, chunk);


        // Return current state without crashing
        return {
          spec: compiler.getResult(),
          newPatches: [],
          isValid: false,
          errors: [err.message],
        };
      }
    },

    getSpec(): Spec {
      return compiler.getResult();
    },

    getPatches(): SpecStreamLine[] {
      return compiler.getPatches();
    },

    reset(newInitial?: Partial<Spec>): void {
      compiler.reset(newInitial ?? EMPTY_SPEC);
      renderer.setSpec(compiler.getResult());
      viewInitialized = false;

    },

    render(): VNode | null {
      try {
        return renderer.render();
      } catch (error) {
        return null;
      }
    },

    getRenderer(): ReziRenderer {
      return renderer;
    },

    dispose(): void {
      renderer.dispose();

    },
  };
}

/**
 * Process an async iterable of chunks through a streaming renderer.
 *
 * Convenience function for processing AI streams with automatic error handling.
 *
 * @param streaming - The streaming renderer instance
 * @param stream - Async iterable of string chunks
 * @param options - Optional callbacks
 * @returns Final compiled spec
 *
 * @example
 * ```ts
 * const streaming = createStreamingRenderer({ app, components });
 *
 * // With AI SDK
 * const result = await streamText({ model: "...", prompt: "..." });
 * const finalSpec = await processStream(streaming, result.textStream);
 *
 * // With fetch
 * const response = await fetch("/api/generate");
 * const reader = response.body!.getReader();
 * const decoder = new TextDecoder();
 *
 * const finalSpec = await processStream(streaming, {
 *   [Symbol.asyncIterator]() {
 *     return {
 *       async next() {
 *         const { done, value } = await reader.read();
 *         return done ? { done: true, value: undefined } : { value: decoder.decode(value) };
 *       }
 *     };
 *   }
 * });
 * ```
 */
export async function processStream(
  streaming: StreamingRenderer,
  stream: AsyncIterable<string>,
  options?: {
    onChunk?: (result: StreamingPushResult) => void;
    onError?: (error: Error) => void;
  },
): Promise<Spec> {
  for await (const chunk of stream) {
    const result = streaming.push(chunk);
    options?.onChunk?.(result);

    if (result.errors && result.errors.length > 0) {
      for (const error of result.errors) {
        options?.onError?.(new Error(error));
      }
    }
  }

  return streaming.getSpec();
}

/**
 * Create a streaming renderer connected to a Rezi app.
 *
 * Convenience factory that sets up the streaming renderer with hot reload
 * integration and a default view function.
 *
 * @param app - Rezi App instance
 * @param options - Additional options
 * @returns StreamingRenderer instance
 *
 * @example
 * ```ts
 * import { createNodeApp } from "@rezi-ui/node";
 * import { createAppStreamingRenderer, defaultComponents } from "@cbrunnkvist/json-render-rezitui";
 *
 * const app = createNodeApp({ initialState: {} });
 * const streaming = createAppStreamingRenderer(app, {
 *   components: defaultComponents,
 * });
 *
 * // The view is automatically set up
 * await app.run();
 * ```
 */
export function createAppStreamingRenderer(
  app: StreamingAppAdapter,
  options: Omit<StreamingRendererOptions, "app"> = {},
): StreamingRenderer {
  return createStreamingRenderer({
    ...options,
    app,
  });
}
