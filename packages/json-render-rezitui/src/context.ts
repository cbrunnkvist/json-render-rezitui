import type { ReziRenderer } from "./renderer.js";

let currentRenderer: ReziRenderer | null = null;

/**
 * Hook for accessing the current renderer from custom widget components.
 *
 * This hook works by storing the renderer in a module-level context
 * during render. Custom widgets can use this to access state, emit events,
 * or interact with the renderer.
 *
 * @returns The current ReziRenderer instance
 * @throws Error if called outside of a render context
 *
 * @example
 * ```ts
 * const CustomWidget: ReziComponentFn = (ctx) => {
 *   const renderer = useRenderer();
 *   const count = renderer.getState("/count");
 *   return ui.text(`Count: ${count}`);
 * };
 * ```
 */
export function useRenderer(): ReziRenderer {
  if (!currentRenderer) {
    throw new Error(
      "useRenderer() must be called within a render context. " +
        "Ensure the renderer is being used through createReziApp() or " +
        "that the widget is rendered as part of a ReziRenderer.render() call."
    );
  }
  return currentRenderer;
}

/**
 * Set the current renderer context (internal use).
 * Called by ReziRenderer during render to enable useRenderer() hook.
 */
export function setRendererContext(renderer: ReziRenderer | null): void {
  currentRenderer = renderer;
}
