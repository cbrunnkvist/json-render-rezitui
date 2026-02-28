# Architecture & Design Overview

`@cbrunnkvist/json-render-rezitui` is a translation layer bridging declarative JSON UI specifications (`@json-render/core`) and the imperative/functional terminal rendering engine of [Rezi](https://rezitui.dev).

## High-Level Design

At its core, the library follows a linear unidirectional rendering pipeline:

1. **JSON Specification**: The application starts with a flat `Spec` containing `"elements"` and a `"root"` node pointer, along with an optional `"state"` slice.
2. **ReziRenderer Core**: The `ReziRenderer` orchestrates the conversion. It subscribes to the underlying `@json-render/core` State Store.
3. **Component Translation (The Registry)**: For each node in the JSON spec, the renderer resolves component props (including dynamic bindings like `{ "$state": "/path" }`) and invokes a registered Component Function.
4. **Virtual DOM Generation**: The Component Functions emit Rezi Virtual Nodes (`VNode`). These nodes form a nested tree (e.g., `ui.column` containing `ui.text` and `ui.button`).
5. **Rezi Layout & Render**: The final VNode tree is passed directly to an active `Rezi` application instance (`createApp`), which internally measures, lays out, and paints the components to the terminal using ANSI escape sequences.
6. **Event Loop**: Interactive Rezi components (like `Input` or `Button`) trigger callbacks that map back to defined "Actions" (e.g., `setState`, `submitData`). These actions mutate the State Store, which alerts the `ReziRenderer`, triggering the cycle over again.

---

## The "Hybrid" Component Strategy: Quirks & Compromises

Translating JSON props directly into Rezi functional components isn't always a 1:1 mapping. We had to adopt a **hybrid approach**—some components are pure passthroughs (basic), while others are artificially composed (composite) to work around Rezi's primitive constraints.

### 1. `Text` Newline Splitting (Composite Workaround)
**The Quirk**: Rezi's native `ui.text({ wrap: true })` does not correctly handle explicit newline (`\n`) characters when painting to the drawlist, despite allocating the correct vertical layout height. Text gets clipped to a single row.
**The Compromise**: Our `Text` component is actually a composite. It intercepts the incoming string, splits it by `\n`, and maps it into a `ui.column({ gap: 0 })` containing multiple individual `ui.text()` nodes. 
**Consequence**: This artificially inflates the VNode tree depth and avoids Rezi's native wrapping engine entirely for explicit linebreaks.

### 2. `Panel` / `Box` Border Limitations
**The Quirk**: Rezi's `ui.box` natively supports basic title strings and borders, but lacks complex title alignment, inner padding separate from the border, or footer support.
**The Compromise**: We expose a `Panel` component that leans heavily on native `ui.box(title, ...children)`. However, fine-grained margin and padding controls don't perfectly map to TUI cells standard CSS models. We omit some layout props (like margin) that don't translate correctly to Rezi's constraint solver without adding hidden spacer boxes.

### 3. State Bindings vs Rezi Keys
**The Quirk**: In React, components maintain state across renders using referential identity or `key` props. Rezi tears down and rebuilds the VNode tree frequently on state updates.
**The Compromise**: We rely on `@json-render`'s external state store as the singular source of truth. Form inputs (`Input`, `Checkbox`, `Slider`) are fully controlled components. They intercept `onInput` Rezi events, fire state mutations, and immediately re-render from the top down. Rezi doesn't have local component state; the "local" state is mapped to the JSON pointer (e.g., `/form/name`).

### 4. Visibility Toggling
**The Quirk**: Toggling a component's visibility in traditional DOM leaves placeholder space or completely unmounts.
**The Compromise**: If `visible` evaluates to `false`, we explicitly return `null` during tree traversal. The parent `Row` or `Column` must intelligently filter out undefined/null children before passing them to Rezi (`children.filter(Boolean)`), otherwise Rezi's layout engine crashes attempting to measure nonexistent nodes.

### 5. Application Exit & Keybindings (`Ctrl-C` vs `Esc`)
**The Quirk**: Rezi operates the terminal in raw mode. If an app crashes or exits without cleanup, the user's terminal is left in a broken state. Furthermore, Rezi's event router differentiates between global keys and bubbled widget events.
**The Compromise**:
- **`Ctrl-C`**: This *must* be caught globally via `@rezi-ui/node`'s `nodeApp.keys({ "ctrl+c": () => nodeApp.stop() })`. This forcibly tears down the Rezi renderer and restores the terminal state, regardless of what widget is focused.
- **`Esc`**: If you bind `"escape"` globally via `nodeApp.keys()`, it intercepts the event *before* it reaches the widget tree. This breaks Rezi's native behavior (`routeLayerEscape`) where Modals and Dropdowns close themselves on `Esc`. Therefore, to allow a top-level `Esc` to exit the app, you MUST NOT bind it globally. Instead, you must wrap the root VNode in a `ui.onInput` handler. If `Esc` is pressed while a modal is open, the modal consumes it and stops propagation. If `Esc` is pressed with top-level focus (no modal open), the event bubbles up to your root `onInput` wrapper, where you can safely call `app.stop()`.

---

## Known Shortcomings

1. **Responsive Wrapping**: Because we manually split text on `\n` to fix multiline rendering, organic word-wrapping at edge constraints is brittle. A very long line without `\n` might still clip at the parent container boundary depending on the exact parent layout (`ui.row` vs `ui.column`).
2. **Scrollable Viewports**: Rezi handles nested layouts, but true scrollable containers (with hidden overflow and scrollbars) are not natively exposed in the Rezi primitives. The `Logs` component and `VirtualList` concepts currently fake scrolling by manually slicing arrays before passing to the UI tree.
3. **Cursor Control**: Rezi controls the ANSI cursor. When multiple controlled text inputs exist, focus indexing is derived linearly. Restoring exact cursor caret position inside a `textinput` after a reactive state re-render can be glitchy (cursor jumps to the end of the text).
4. **Over-Rendering**: Any mutation in the state store triggers a complete top-down traversal and VNode tree regeneration. While terminal layouts are fast, massive specs (e.g., high rows Table UI) could stutter during rapid typing because Rezi must remeasure every text node. No VNode memorization exists yet.
