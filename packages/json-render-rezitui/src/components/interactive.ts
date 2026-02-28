import {
  ui,
  type VNode,
  type TextProps,
  type ButtonProps,
  type InputProps,
  type SelectProps,
} from "@rezi-ui/core";
import type { ReziComponentContext } from "../types.js";
import { mapStyles } from "../styles.js";

// =============================================================================
// ID Generation
// =============================================================================

let idCounter = 0;

/**
 * Generate a unique ID for interactive widgets.
 * Format: `{prefix}-{counter}`
 *
 * @param prefix - Prefix for the ID (e.g., "button", "input")
 * @returns Unique ID string
 */
export function generateId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/**
 * Reset the ID counter. Useful for testing.
 */
export function resetIdCounter(): void {
  idCounter = 0;
}

// =============================================================================
// Text Component
// =============================================================================

/**
 * Text component - renders text content with optional styling.
 * Maps to ui.text(content, styleOrProps).
 *
 * @param ctx - Component context with props
 * @returns VNode for the Text
 *
 * @example
 * // JSON spec:
 * { type: "Text", props: { content: "Hello World" } }
 * { type: "Text", props: { content: "Title", color: "cyan", bold: true } }
 */
export function Text(ctx: ReziComponentContext<TextProps & { content?: string }>): VNode {
  const { content, bindings, ...restProps } = ctx.props as any;
  const textContent = content !== undefined && content !== null ? String(content) : "";

  const mappedProps = mapStyles(restProps);

  // Workaround for Rezi rendering bug: wrap: true measures correct height
  // but only paints text on row 0. We split on \n ourselves and render
  // each line segment as a separate ui.text() in a gap-0 column.
  if (textContent.includes("\n")) {
    const lines = textContent.split("\n");
    const children = lines.map((line: string) => ui.text(line, mappedProps));
    return ui.column({ gap: 0 }, children);
  }

  return ui.text(textContent, mappedProps);
}

// =============================================================================
// Button Component
// =============================================================================

/**
 * Button component - interactive button with auto-ID generation.
 * Maps to ui.button(id, label, props) with onPress wired to emit.
 *
 * @param ctx - Component context with props
 * @returns VNode for the Button
 */
export function Button(
  ctx: ReziComponentContext<Omit<ButtonProps, 'id'> & { id?: string }>
): VNode {
  const { id, label, ...restProps } = ctx.props;

  // Auto-generate ID if not provided
  const buttonId = id ?? ctx.id("button");
  const buttonLabel = label ?? "Button";

  const onHandle = ctx.on("press");

  return ui.button(buttonId, buttonLabel, {
    ...mapStyles(restProps),
    onPress: onHandle.bound ? onHandle.emit : undefined,
  });
}

// =============================================================================
// Input Component
// =============================================================================

export function Input(
  ctx: ReziComponentContext<
    Omit<InputProps, 'id'> & {
      bindings?: { value?: string };
      id?: string;
    }
  >
) {
  const { id, value, bindings, ...restProps } = ctx.props;
  const inputValue = value ?? ""

  // Auto-generate ID if not provided
  const inputId = id ?? ctx.id("input");

  const onHandle = ctx.on("input");

  // If bindings.value is set, emit state change events
  if (bindings?.value) {
    const boundHandleInput = (newValue: string) => {
      ctx.dispatchAction("setState", { path: bindings!.value, value: newValue });
      if (onHandle.bound) onHandle.emit({ value: newValue });
    };

    return ui.input(inputId, inputValue, {
      ...mapStyles(restProps),
      onInput: boundHandleInput,
    });
  }

  return ui.input(inputId, inputValue, {
    ...mapStyles(restProps),
    onInput: onHandle.bound ? (val) => onHandle.emit({ value: val }) : undefined,
  });
}

// =============================================================================
// Select Component
// =============================================================================

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export function Select(
  ctx: ReziComponentContext<
    Omit<SelectProps, 'id'> & {
      options?: SelectOption[];
      id?: string;
      bindings?: { value?: string };
    }
  >
): VNode {
  const { id, options, value, ...restProps } = ctx.props;
  const selectId = id ?? ctx.id("select");

  const onHandle = ctx.on("change");

  return ui.select({
    id: selectId,
    options: options ?? [],
    value: value ?? "",
    ...mapStyles(restProps),
    onChange: (val) => {
      if (ctx.props.bindings?.value) {
        ctx.dispatchAction("setState", { path: ctx.props.bindings.value, value: val });
      }
      if (onHandle.bound) onHandle.emit({ value: val });
    },
  });
}

// =============================================================================
// Checkbox Component
// =============================================================================

export function Checkbox(
  ctx: ReziComponentContext<
    Omit<import("@rezi-ui/core").CheckboxProps, 'id'> & {
      id?: string;
      bindings?: { value?: string };
    }
  >
): VNode {
  const { id, ...restProps } = ctx.props;

  // Auto-generate ID if not provided
  const checkboxId = id ?? ctx.id("checkbox");

  const onHandle = ctx.on("change");

  return ui.checkbox({
    id: checkboxId,
    ...mapStyles(restProps),
    onChange: (val: boolean) => {
      if (ctx.props.bindings?.value) {
        ctx.dispatchAction("setState", { path: ctx.props.bindings.value, value: val });
      }
      if (onHandle.bound) onHandle.emit({ value: val });
    },
  });
}

// =============================================================================
// Slider Component
// =============================================================================

export function Slider(
  ctx: ReziComponentContext<
    Omit<import("@rezi-ui/core").SliderProps, 'id'> & {
      id?: string;
      bindings?: { value?: string };
    }
  >
): VNode {
  const { id, ...restProps } = ctx.props;

  // Auto-generate ID if not provided
  const sliderId = id ?? ctx.id("slider");

  const onHandle = ctx.on("change");

  return ui.slider({
    id: sliderId,
    ...mapStyles(restProps),
    onChange: (val: number) => {
      if (ctx.props.bindings?.value) {
        ctx.dispatchAction("setState", { path: ctx.props.bindings.value, value: val });
      }
      if (onHandle.bound) onHandle.emit({ value: val });
    },
  });
}
