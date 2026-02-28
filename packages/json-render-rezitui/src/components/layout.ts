import { ui, type BoxProps, type StackProps, type VNode } from "@rezi-ui/core";
import type { ReziComponentContext } from "../types.js";
import { mapStyles } from "../styles.js";

// =============================================================================
// Box Component
// =============================================================================

/**
 * Box layout component - a container with optional border/padding.
 * Maps to ui.box() with preset handling.
 *
 * @param ctx - Component context with props and children
 * @returns VNode for the Box
 */
export function Box(ctx: ReziComponentContext<BoxProps>): VNode {
  return ui.box(mapStyles(ctx.props), ctx.children);
}

// =============================================================================
// Row Component
// =============================================================================

/**
 * Row layout component - horizontal flex container.
 * Maps to ui.row() with gap default.
 *
 * @param ctx - Component context with props and children
 * @returns VNode for the Row
 */
export function Row(ctx: ReziComponentContext<StackProps & { wrap?: boolean }>): VNode {
  const { wrap, ...stackProps } = ctx.props;
  return ui.row(mapStyles(stackProps), ctx.children);
}

// =============================================================================
// Column Component
// =============================================================================

/**
 * Column layout component - vertical flex container.
 * Maps to ui.column() with gap default.
 *
 * @param ctx - Component context with props and children
 * @returns VNode for the Column
 */
export function Column(ctx: ReziComponentContext<StackProps & { wrap?: boolean }>): VNode {
  const { wrap, ...stackProps } = ctx.props;
  return ui.column(mapStyles(stackProps), ctx.children);
}
