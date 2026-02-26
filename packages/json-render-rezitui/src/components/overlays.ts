import { ui, type VNode, type ModalProps, type DialogProps, type DropdownProps, type CommandPaletteProps, addToast } from "@rezi-ui/core";
import type { ReziComponentContext } from "../types.js";

/**
 * Modal overlay component - a centered dialog with optional backdrop.
 * Maps to ui.modal() factory function.
 *
 * @param ctx - Component context with props and children
 * @returns VNode for the Modal
 */
export function Modal(ctx: ReziComponentContext<ModalProps>): VNode {
  return ui.modal({
    ...ctx.props,
    content: ctx.children && ctx.children.length > 0
      ? ui.box({}, ctx.children)
      : ctx.props.content,
  });
}

// =============================================================================
// Dialog Component
// =============================================================================

/**
 * Dialog component - a declarative modal with arbitrary actions.
 * Maps to ui.dialog() factory function.
 *
 * @param ctx - Component context with props
 * @returns VNode for the Dialog
 */
export function Dialog(ctx: ReziComponentContext<DialogProps>): VNode {
  return ui.dialog(ctx.props);
}

// =============================================================================
// Dropdown Component
// =============================================================================

/**
 * Dropdown component - a menu positioned relative to an anchor.
 * Maps to ui.dropdown() factory function.
 *
 * @param ctx - Component context with props
 * @returns VNode for the Dropdown
 */
export function Dropdown(ctx: ReziComponentContext<DropdownProps>): VNode {
  return ui.dropdown(ctx.props);
}

// =============================================================================
// CommandPalette Component
// =============================================================================

/**
 * CommandPalette component - a quick-access command execution interface.
 * Maps to ui.commandPalette() factory function.
 *
 * @param ctx - Component context with props
 * @returns VNode for the CommandPalette
 */
export function CommandPalette(ctx: ReziComponentContext<CommandPaletteProps>): VNode {
  return ui.commandPalette(ctx.props);
}

// =============================================================================
// Toast Action
// =============================================================================

/**
 * Toast action - adds a toast notification to the state.
 * This is NOT a widget, but an action function that returns updated toast state.
 *
 * @param toasts - Current toast list
 * @param toast - Toast to add
 * @returns Updated toast list
 *
 * @example
 * // In a reducer or action handler:
 * const newToasts = toastAction(state.toasts, {
 *   id: "success-1",
 *   type: "success",
 *   message: "Changes saved!",
 * });
 */
export { addToast as toastAction };

// =============================================================================
// Export all overlay components
// =============================================================================

export const overlays = {
  Modal,
  Dialog,
  Dropdown,
  CommandPalette,
} as const;
