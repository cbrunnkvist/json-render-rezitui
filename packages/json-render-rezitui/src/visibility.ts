import {
  evaluateVisibility as coreEvaluateVisibility,
  VisibilityContext as CoreVisibilityContext,
  visibility,
  type VisibilityCondition,
} from "@json-render/core";

export { visibility };

export type { VisibilityCondition };

/**
 * Context for evaluating visibility conditions in the Rezi renderer.
 *
 * `repeatItem` and `repeatIndex` are only present inside a `repeat` scope
 * and enable `$item` / `$index` conditions.
 */
export interface VisibilityContext extends CoreVisibilityContext {
  /** The current repeat item (set inside a repeat scope). */
  repeatItem?: unknown;
  /** The current repeat array index (set inside a repeat scope). */
  repeatIndex?: number;
}

/**
 * Evaluate a visibility condition against the current state.
 *
 * @param condition - The visibility condition to evaluate
 * @param ctx - The visibility context with state model and optional repeat context
 * @returns True if the element should be visible, false otherwise
 *
 * @example
 * // Simple state-based visibility
 * const isVisible = evaluateVisibility(
 *   { $state: "/showModal" },
 *   { stateModel: { showModal: true } }
 * );
 *
 * @example
 * // With repeat context (inside a repeat scope)
 * const isVisible = evaluateVisibility(
 *   { $index: true, eq: 0 },
 *   { stateModel: {}, repeatIndex: 0 }
 * );
 *
 * @example
 * // Logical operators
 * const isVisible = evaluateVisibility(
 *   { $and: [{ $state: "/isAdmin" }, { $state: "/isActive" }] },
 *   { stateModel: { isAdmin: true, isActive: true } }
 * );
 */
export function evaluateVisibility(
  condition: VisibilityCondition | undefined,
  ctx: VisibilityContext,
): boolean {
  return coreEvaluateVisibility(condition, ctx);
}

/**
 * Helper to create a visibility context from the current state model.
 *
 * @param stateModel - The current state model
 * @param repeatItem - Optional: current repeat item
 * @param repeatIndex - Optional: current repeat index
 * @returns VisibilityContext for evaluating conditions
 *
 * @example
 * const ctx = createVisibilityContext(store.getSnapshot());
 * if (evaluateVisibility(element.visible, ctx)) {
 *   // render element
 * }
 */
export function createVisibilityContext(
  stateModel: Record<string, unknown>,
  repeatItem?: unknown,
  repeatIndex?: number,
): VisibilityContext {
  return {
    stateModel,
    repeatItem,
    repeatIndex,
  };
}
