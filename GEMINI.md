# @cbrunnkvist/json-render-rezitui

A specialized renderer that transforms JSON UI specifications (based on `@json-render/core`) into interactive terminal user interfaces using the [Rezi](https://rezitui.dev) framework.

## Project Overview

- **Core Purpose:** Enable "Generative UI" in the terminal by rendering dynamic JSON specs into interactive TUIs.
- **Main Technologies:**
    - **TypeScript:** Primary language.
    - **Rezi (`@rezi-ui/core`, `@rezi-ui/node`):** Functional TUI framework used as the rendering target.
    - **`@json-render/core`:** Underlying specification format and state management.
    - **`tsup`:** Build tool for generating ESM and CJS bundles.
    - **`vitest`:** Unit and integration testing framework.
- **Monorepo Structure (pnpm):**
    - `packages/json-render-rezitui`: The main library.
    - `examples/`: Static and agent-driven example applications demonstrating usage.
    - `reference/`: Development references and local copies of upstream dependencies.

## Architecture

1. **ReziRenderer:** The engine that traverses the JSON spec, resolves properties (bindings/expressions), and maps elements to Rezi components.
2. **Registry:** A flexible system for defining and merging component catalogs. It provides a set of built-in components (`Box`, `Text`, `Button`, `Input`, etc.) while allowing users to register custom components.
3. **Action System:** Maps JSON-defined events (e.g., `on: { click: { action: "setState", ... } }`) to executable handlers that mutate the state or trigger side effects.
4. **Integration Layer:** Provides helper functions like `createReziApp` and `createStreamingReziApp` for bootstrapping applications with minimal boilerplate.

## Building and Running

Commands should generally be run from the root or targeting the specific package.

### Key Commands

- **Install Dependencies:**
  ```bash
  pnpm install
  ```
- **Build Package:**
  ```bash
  pnpm -F @cbrunnkvist/json-render-rezitui build
  ```
- **Run Tests:**
  ```bash
  pnpm -F @cbrunnkvist/json-render-rezitui test
  ```
- **Type Check:**
  ```bash
  pnpm -F @cbrunnkvist/json-render-rezitui typecheck
  ```
- **Development Mode (Watch):**
  ```bash
  pnpm -F @cbrunnkvist/json-render-rezitui dev
  ```

## Development Conventions

- **Component Implementation:** Components are functional and take a `ReziComponentContext` which includes props, children, and event emission helpers.
- **State Management:** Uses `@json-render/core` state stores (Zod-backed) with support for JSON Pointer paths.
- **Visibility & Props:** Implements a resolution system for evaluating visibility conditions and property expressions ($state, $item, etc.).
- **Testing:** New features or bug fixes should include tests in `packages/json-render-rezitui/src/__tests__/`. Use existing integration tests as a template.
- **ESM First:** The project uses ESM (`.js` extensions in imports, `"type": "module"` in sub-packages).
