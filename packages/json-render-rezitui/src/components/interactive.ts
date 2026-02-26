import {
  ui,
  type VNode,
  type TextProps,
  type ButtonProps,
  type InputProps,
  type SelectProps,
} from "@rezi-ui/core";
import type { ReziComponentContext } from "../types.js";

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
 * { type: "Text", props: { content: "Title", style: { bold: true } } }
 */
export function Text(ctx: ReziComponentContext<TextProps & { content?: string }>): VNode {
  const { content, ...restProps } = ctx.props;
  const textContent = content ?? "";

  // Check if restProps contains TextProps fields (style, id, variant, etc.)
  const hasTextProps = Object.keys(restProps).length > 0;

  if (hasTextProps) {
    return ui.text(textContent, restProps as TextProps);
  }

  return ui.text(textContent);
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
 *
 * { type: "Button", props: { id: "submit-btn", label: "Submit", intent: "primary" } }
 */
export function Button(
  ctx: ReziComponentContext<Omit<ButtonProps, 'id'> & { onPress?: string | (() => void); id?: string }>
): VNode {
  const { id, label, onPress, ...restProps } = ctx.props;

  // Auto-generate ID if not provided
  const buttonId = id ?? ctx.id("button");
  const buttonLabel = label ?? "Button";

  // Wire onPress to emit if it's a string (action name)
  const handlePress = typeof onPress === "string"
    ? () => ctx.emit("press", { action: onPress })
    : onPress;

  return ui.button(buttonId, buttonLabel, {
    ...restProps,
    onPress: handlePress,
  });
}

// =============================================================================
// Input Component
// =============================================================================

/**
 * Input component - text input with two-way binding support.
 * Maps to ui.input(id, value, props) with onInput wired to emit.
 *
 * Supports `bindings` prop for two-way state binding:
 * - `bindings.value` - JSON Pointer path for the value
 *
 * @param ctx - Component context with props
 * @returns VNode for the Input
 *
 * @example
 * // JSON spec:
 * { type: "Input", props: { placeholder: "Enter name", bindings: { value: "/user/name" } } }
 * { type: "Input", props: { id: "email", value: "initial@example.com" } }
 */
export function Input(
  ctx: ReziComponentContext<
    Omit<InputProps, 'id'> & {
      bindings?: { value?: string };
      onInput?: string | ((value: string) => void);
      id?: string;
    }
  >
) {
  const { id, value, bindings, onInput, ...restProps } = ctx.props;
  const inputValue = value ?? ""

  // Auto-generate ID if not provided
  const inputId = id ?? ctx.id("input");

  // Wire onInput to emit if it's a string (action name)
  const handleInput = typeof onInput === "string"
    ? (newValue: string) => ctx.emit("input", { action: onInput, value: newValue })
    : onInput;

  // If bindings.value is set, emit state change events
  if (bindings?.value) {
    const boundHandleInput = (newValue: string) => {
      ctx.emit("state:set", { path: bindings.value, value: newValue });
      handleInput?.(newValue);
    };

    return ui.input(inputId, inputValue, {
      ...restProps,
      onInput: boundHandleInput,
    });
  }

  return ui.input(inputId, inputValue, {
    ...restProps,
    onInput: handleInput,
  });
}

// =============================================================================
// Select Component
// =============================================================================

/**
 * Select option type for the Select component.
 */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Select component - dropdown selection with onChange support.
 * Maps to ui.select(props) with onChange wired to emit.
 *
 * @param ctx - Component context with props
 * @returns VNode for the Select
 *
 * @example
 * // JSON spec:
 * {
 *   type: "Select",
 *   props: {
 *     id: "country",
 *     options: [
 *       { value: "us", label: "United States" },
 *       { value: "uk", label: "United Kingdom" }
 *     ],
 *     onChange: "handleCountryChange"
 *   }
 * }
 */
export function Select(
  ctx: ReziComponentContext<
    Omit<SelectProps, 'id'> & {
      options?: SelectOption[];
      onChange?: string | ((value: string) => void);
      id?: string;
    }
  >
): VNode {
  const { id, options, value, onChange, ...restProps } = ctx.props;
  const selectId = id ?? ctx.id("select");

  // Wire onChange to emit if it's a string (action name)
  const handleChange = typeof onChange === "string"
    ? (newValue: string) => ctx.emit("change", { action: onChange, value: newValue })
    : onChange;

  return ui.select({
    id: selectId,
    options: options ?? [],
    value: value ?? "",
    ...restProps,
    onChange: handleChange,
  });
}

// =============================================================================
// Checkbox Component
// =============================================================================

/**
 * Checkbox component - boolean toggle with onChange support.
 * Maps to ui.checkbox(props) with onChange wired to emit.
 *
 * @param ctx - Component context with props
 * @returns VNode for the Checkbox
 *
 * @example
 * // JSON spec:
 * { type: "Checkbox", props: { id: "remember", label: "Remember me", checked: true } }
 */
export function Checkbox(
  ctx: ReziComponentContext<
    Omit<import("@rezi-ui/core").CheckboxProps, 'id'> & {
      onChange?: string | ((checked: boolean) => void);
      id?: string;
    }
  >
): VNode {
  const { id, onChange, ...restProps } = ctx.props;

  // Auto-generate ID if not provided
  const checkboxId = id ?? ctx.id("checkbox");

  // Wire onChange to emit if it's a string (action name)
  const handleChange = typeof onChange === "string"
    ? (checked: boolean) => ctx.emit("change", { action: onChange, value: checked })
    : onChange;

  return ui.checkbox({
    id: checkboxId,
    ...restProps,
    onChange: handleChange,
  });
}

// =============================================================================
// Slider Component
// =============================================================================

/**
 * Slider component - range input with onChange support.
 * Maps to ui.slider(props) with onChange wired to emit.
 *
 * @param ctx - Component context with props
 * @returns VNode for the Slider
 *
 * @example
 * // JSON spec:
 * { type: "Slider", props: { id: "volume", min: 0, max: 100, value: 50 } }
 */
export function Slider(
  ctx: ReziComponentContext<
    Omit<import("@rezi-ui/core").SliderProps, 'id'> & {
      onChange?: string | ((value: number) => void);
      id?: string;
    }
  >
): VNode {
  const { id, onChange, ...restProps } = ctx.props;

  // Auto-generate ID if not provided
  const sliderId = id ?? ctx.id("slider");

  // Wire onChange to emit if it's a string (action name)
  const handleChange = typeof onChange === "string"
    ? (value: number) => ctx.emit("change", { action: onChange, value })
    : onChange;

  return ui.slider({
    id: sliderId,
    ...restProps,
    onChange: handleChange,
  });
}
