import {
  resolvePropValue as coreResolvePropValue,
  resolveElementProps as coreResolveElementProps,
  resolveBindings as coreResolveBindings,
  resolveActionParam as coreResolveActionParam,
  type PropExpression,
  type PropResolutionContext,
  type ComputedFunction,
} from "@json-render/core";

export type { PropExpression, PropResolutionContext, ComputedFunction };

// Re-export internal reset functions for testing
// (Not available in core exports, so we don't re-export them here)

/**
 * Context for resolving prop expressions in the Rezi renderer.
 * Extends the core PropResolutionContext with Rezi-specific repeat context.
 */
export interface ReziPropResolutionContext extends PropResolutionContext {
  /** The current repeat item (set inside a repeat scope). */
  repeatItem?: unknown;
  /** The current repeat array index (set inside a repeat scope). */
  repeatIndex?: number;
  /** Absolute state path to the current repeat item (e.g. "/todos/0"). */
  repeatBasePath?: string;
  /** Arbitrary event state for $event references */
  event?: unknown;
}

/**
 * Resolve a single prop value that may contain expressions.
 *
 * Handles $state, $item, $index, $bindState, $bindItem, $cond/$then/$else,
 * $computed, and $template expressions.
 *
 * @param value - The prop value to resolve (may be an expression object)
 * @param ctx - The prop resolution context with state model and optional repeat context
 * @returns The resolved value
 *
 * @example
 * // Resolve $state expression
 * const value = resolvePropValue({ $state: "/form/name" }, { stateModel: { form: { name: "John" } } });
 * // Returns "John"
 *
 * @example
 * // Resolve $cond expression
 * const value = resolvePropValue(
 *   { $cond: { $state: "/isActive" }, $then: "Active", $else: "Inactive" },
 *   { stateModel: { isActive: true } }
 * );
 * // Returns "Active"
 */
export function resolvePropValue(
  value: unknown,
  ctx: ReziPropResolutionContext,
): unknown {
  return coreResolvePropValue(value, ctx);
}

/**
 * Resolve all prop values in an element's props object.
 * Returns a new props object with all expressions resolved.
 *
 * @param props - The raw props object with potential expressions
 * @param ctx - The prop resolution context
 * @returns A new object with all expressions resolved to their values
 *
 * @example
 * const resolved = resolveElementProps(
 *   { label: { $state: "/buttonLabel" }, disabled: { $state: "/isDisabled" } },
 *   { stateModel: { buttonLabel: "Click Me", isDisabled: false } }
 * );
 * // Returns { label: "Click Me", disabled: false }
 */
export function resolveElementProps(
  props: Record<string, unknown>,
  ctx: ReziPropResolutionContext,
): Record<string, unknown> {
  return coreResolveElementProps(props, ctx);
}

/**
 * Scan an element's raw props for $bindState / $bindItem expressions
 * and return a map of prop name → resolved absolute state path.
 *
 * This is called before resolveElementProps so the component can
 * receive both the resolved value (in props) and the write-back path (in bindings).
 *
 * @param props - The raw props object
 * @param ctx - The prop resolution context
 * @returns Record of prop name to state path, or undefined if no bindings
 *
 * @example
 * const rawProps = { value: { $bindState: "/form/email" }, label: "Email" };
 * const bindings = resolveBindings(rawProps, ctx);
 * // bindings = { value: "/form/email" }
 */
export function resolveBindings(
  props: Record<string, unknown>,
  ctx: ReziPropResolutionContext,
): Record<string, string> | undefined {
  return coreResolveBindings(props, ctx);
}

/**
 * Resolve a single action parameter value.
 *
 * Like resolvePropValue but with special handling for path-valued params:
 * - $item resolves to an absolute state path (e.g., /todos/0/field)
 * - $index returns the current repeat index
 * - Everything else delegates to resolvePropValue
 *
 * @param value - The parameter value to resolve
 * @param ctx - The prop resolution context
 * @returns The resolved value or path
 */
export function resolveActionParam(
  value: unknown,
  ctx: ReziPropResolutionContext,
): unknown {
  if (typeof value === "string" && value.startsWith("$event")) {
    if (value === "$event") return ctx.event;
    if (value.startsWith("$event.") && ctx.event && typeof ctx.event === "object") {
      const path = value.slice("$event.".length);
      return (ctx.event as Record<string, unknown>)[path];
    }
  }
  return coreResolveActionParam(value, ctx);
}

/**
 * Resolve a $bindItem path into an absolute state path using the repeat scope's base path.
 *
 * @param itemPath - The path into the repeat item ("" for whole item, "field" for field)
 * @param ctx - The prop resolution context with repeatBasePath
 * @returns The absolute state path, or undefined if not in repeat scope
 *
 * @example
 * const path = resolveBindItemPath("name", { repeatBasePath: "/todos/0" });
 * // Returns "/todos/0/name"
 *
 * @example
 * const path = resolveBindItemPath("", { repeatBasePath: "/todos/0" });
 * // Returns "/todos/0"
 */
export function resolveBindItemPath(
  itemPath: string,
  ctx: ReziPropResolutionContext,
): string | undefined {
  if (ctx.repeatBasePath == null) {
    console.warn(`$bindItem used outside repeat scope: "${itemPath}"`);
    return undefined;
  }
  if (itemPath === "") return ctx.repeatBasePath;
  return ctx.repeatBasePath + "/" + itemPath;
}

/**
 * Helper to create a prop resolution context from the current state model.
 *
 * @param stateModel - The current state model
 * @param repeatItem - Optional: current repeat item
 * @param repeatIndex - Optional: current repeat index
 * @param repeatBasePath - Optional: absolute path to repeat item
 * @param functions - Optional: registered computed functions
 * @returns PropResolutionContext for resolving expressions
 *
 * @example
 * const ctx = createPropResolutionContext(store.getSnapshot(), item, index, "/todos/0");
 * const resolved = resolveElementProps(element.props, ctx);
 */
export function createPropResolutionContext(
  stateModel: Record<string, unknown>,
  repeatItem?: unknown,
  repeatIndex?: number,
  repeatBasePath?: string,
  functions?: Record<string, ComputedFunction>,
): ReziPropResolutionContext {
  return {
    stateModel,
    repeatItem,
    repeatIndex,
    repeatBasePath,
    functions,
  };
}
