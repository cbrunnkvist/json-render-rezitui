# @json-render/rezi — Terminal UI Renderer Package (Renaming: @json-render/rezi → @cbrunnkvist/json-render-rezitui)

## TL;DR

> **Build `@cbrunnkvist/json-render-rezitui`**: A new npm package that renders json-render specs to Rezi terminal UI widgets, enabling AI-generated terminal interfaces from the same spec format used for web, mobile, and PDF.

**Deliverables**:
- `@cbrunnkvist/json-render-rezitui` npm package with TypeScript types
- `ReziRenderer` class for spec-to-VNode rendering
- `defineReziRegistry()` for component mapping
- **Two-catalog architecture**:
  - `catalog-core`: ~35 React-compatible components (cross-platform)
  - `catalog-terminal`: ~25 Rezi-native power-user components
- **LLM-friendly composites**: Page, Header, Panel, MetricRow, KeyValueTable, FilterBar, ConfirmActionModal
- **SpecStream integration** for progressive AI-generated UI updates
- Integration with `createNodeApp()` for terminal apps
- Test suite with Vitest
**Estimated Effort**: Medium (2-3 focused sessions)
**Parallel Execution**: YES - 4 waves with 4-5 tasks each
**Critical Path**: Core Renderer → Component Mappings → Actions/State → SpecStream → Integration

---

## Context

### Original Request
Create `@cbrunnkvist/json-render-rezitui` by combining the Rezi terminal UI framework with the json-render generative UI framework, enabling a new category of data-in-the-terminal applications.

### Interview Summary

**Key Discussions**:
- **Catalog Architecture**: Two-catalog approach — `catalog-core` (React-compatible) + `catalog-terminal` (Rezi-native)
- **React Compatibility**: Core catalog components map 1:1 to web equivalents (divs, dialogs, popovers, tables)
- **Fallback Rules**: Terminal-only components have graceful fallbacks for web rendering
- **Schema Strategy**: Hybrid — same spec format, catalog determines platform capabilities
- **Action Routing**: Hybrid — built-in handlers with overridable callbacks
- **Streaming**: Include SpecStream integration in initial scope — progressive rendering for AI-generated specs
### Metis Review

**Identified Gaps** (addressed):
- **Error Handling**: Hybrid approach — Rezi error codes internally, error boundaries for graceful degradation
- **ID Generation**: Auto-generate from element key path with `ctx.id()` pattern for repeat scopes
- **Terminal Constraints**: Documented fallback strategies (color depth, unicode, screen size)
- **Testing**: Vitest for consistency with json-render packages
- **State Sync**: Queue updates via Rezi's `TurnScheduler` pattern, not synchronous writes

---

## Work Objectives

### Core Objective
Build a production-ready `@cbrunnkvist/json-render-rezitui` package that renders json-render specs to Rezi terminal UI widgets, with two-catalog architecture supporting both React-compatible and terminal-native components.

### Concrete Deliverables
- `packages/json-render-rezi/` directory with full package structure
- `ReziRenderer` class implementing json-render's renderer interface
- **catalog-core** (~35 components):
  - Primitives: Text, Box, Row, Column, Spacer, Divider, Grid
  - Indicators: Icon, Badge, Tag, Status, Spinner, Progress, Skeleton
  - Inputs: Button, Input, Textarea, Checkbox, RadioGroup, Select, Field
  - Navigation: Tabs, Accordion, Breadcrumb, Link, Pagination
  - Data: Table, VirtualList, Tree
  - Overlays: Modal, Dropdown, Toast
  - Feedback: Callout, Empty, ErrorDisplay, ErrorBoundary
- **catalog-terminal** (~25 components):
  - Terminal text: RichText, Kbd
  - Complex layouts: SplitPane, PanelGroup, ResizablePanel
  - Terminal tools: CommandPalette, FilePicker, FileTreeExplorer, CodeEditor, DiffViewer, LogsConsole, ToolApprovalDialog
  - Charts: Gauge, Sparkline, BarChart, MiniChart, Canvas, Image, LineChart, Scatter, Heatmap
- **LLM-friendly composites**: Page, Header, Panel, MetricRow, KeyValueTable, FilterBar, ConfirmActionModal
- State management integration via `StateStore`
- **SpecStream integration** for streaming AI-generated specs
- Action handlers for terminal-specific operations
- Type definitions generated from Rezi's widget types
- Working example app demonstrating integration
### Definition of Done
- [ ] `npm run build` produces valid dist files
- [ ] `npx tsc --noEmit` passes without errors
- [ ] catalog-core components have registry entries verified by test
- [ ] catalog-terminal components have registry entries verified by test
- [ ] Basic rendering test passes with sample spec
- [ ] Error handling test passes with missing element
- [ ] State binding test passes with `$state` resolution
- [ ] SpecStream integration test passes with progressive updates
- [ ] Fallback rules work for terminal-only components
- [ ] No remaining references to `@json-render/rezi` in codebase
- [ ] All import statements use `json-render-rezitui` module name

### Must Have
- `ReziRenderer` class with `render(spec)` method
- `defineReziRegistry()` function matching json-render's API
- **catalog-core**: React-compatible components with correct prop translation
- **catalog-terminal**: Rezi-native components with fallback rules
- **LLM-friendly composites**: Page, Header, Panel, MetricRow, etc.
- **SpecStream integration** for streaming AI-generated specs
- TypeScript types for all public APIs
- Basic error handling (missing elements, invalid types)
- `StateStore` integration for `$state` bindings
- **Platform capability tags**: `{ platforms: ["tui"] }` for terminal-only components
### Must NOT Have (Guardrails)
- Custom widget implementations (only mappings to existing Rezi widgets)
- React or DOM dependencies
- Browser-specific code
- CSS/style processing
- Animation helpers (use Rezi's built-in hooks instead)

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO (new package)
- **Automated tests**: YES — Vitest for consistency with json-render packages
- **Framework**: Vitest + @rezi-ui/testkit for terminal snapshot testing
- **Agent-Executed QA**: YES — CLI/TUI testing via tmux

### QA Policy
Every task includes agent-executed QA scenarios:
- **TUI/CLI**: Use `interactive_bash` (tmux) — Run command, send keystrokes, validate output
- **Library/Module**: Use Bash (bun/node REPL) — Import, call functions, compare output

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — foundation):
├── Task 1: Package scaffolding + TypeScript config [quick]
├── Task 2: Type definitions + catalog types [quick]
├── Task 3: Schema extension with terminal rules [quick]
└── Task 4: Core ReziRenderer class [deep]

Wave 2 (After Wave 1 — catalog-core, React-compatible):
├── Task 5: Primitives (Text, Box, Row, Column, Spacer, Divider, Grid) [quick]
├── Task 6: Indicators (Icon, Badge, Tag, Status, Spinner, Progress, Skeleton) [quick]
├── Task 7: Inputs (Button, Input, Textarea, Checkbox, RadioGroup, Select, Field) [deep]
├── Task 8: Navigation (Tabs, Accordion, Breadcrumb, Link, Pagination) [quick]
├── Task 9: Data display (Table, VirtualList, Tree) [deep]
└── Task 10: Overlays + Feedback (Modal, Dropdown, Toast, Callout, Empty, ErrorDisplay) [quick]

Wave 3 (After Wave 2 — catalog-terminal, Rezi-native):
├── Task 11: Terminal text + layouts (RichText, Kbd, SplitPane, PanelGroup, ResizablePanel) [quick]
├── Task 12: Terminal tools (CommandPalette, FilePicker, FileTreeExplorer, CodeEditor, DiffViewer) [deep]
├── Task 13: Logs + dialogs (LogsConsole, ToolApprovalDialog) [quick]
├── Task 14: Charts (Gauge, Sparkline, BarChart, MiniChart, Canvas, Image, LineChart, Scatter, Heatmap) [quick]
└── Task 15: LLM-friendly composites (Page, Header, Panel, MetricRow, KeyValueTable, FilterBar, ConfirmActionModal) [deep]

Wave 4 (After Wave 3 — state, actions, fallbacks):
├── Task 16: State management integration [deep]
├── Task 17: Visibility + prop resolution [quick]
├── Task 18: Action handlers (setState, focus, toast, quit) [deep]
├── Task 19: Event bindings and emit() [quick]
├── Task 20: Fallback rules for terminal-only components [deep]
└── Task 21: SpecStream integration for streaming specs [deep]

Wave 5 (After Wave 4 — integration and testing):
├── Task 22: createNodeApp integration helper [deep]
├── Task 23: defineReziRegistry + catalog exports [quick]
├── Task 24: ID generation strategy [quick]
├── Task 25: Error handling and boundaries [deep]
└── Task 26: Full test suite [deep]

Wave 6 (Renaming to personal namespace):
├── Task 27: Update package.json name and repository [quick]
├── Task 28: Update README.md and documentation [quick]
├── Task 29: Update example app imports [quick]
└── Task 30: Global verification [deep]

Wave FINAL (After ALL tasks — verification):
├── Task F1: Plan compliance audit [oracle]
├── Task F2: Code quality review [unspecified-high]
├── Task F3: Real manual QA [unspecified-high]
└── Task F4: Scope fidelity check [deep]

Critical Path: Task 1 → Task 4 → Task 7 → Task 16 → Task 18 → Task 21 → Task 26 → F1-F4
Parallel Speedup: ~70% faster than sequential
Max Concurrent: 6 (Wave 2)
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|------------|--------|
| 1 | — | 4, 23 |
| 2 | — | 5-15, 25 |
| 3 | — | 4, 17 |
| 4 | 1, 3 | 16, 18, 19, 21 |
| 5-6 | 2 | 26 |
| 7 | 2, 24 | 26 |
| 8-10 | 2 | 26 |
| 11-14 | 2 | 26 |
| 15 | 2, 5-10 | 26 |
| 16 | 4 | 18, 22 |
| 17 | 3, 4 | 26 |
| 18 | 16 | 22, 26 |
| 19 | 4, 17 | 26 |
| 20 | 2, 11-14 | 26 |
| 21 | 4 | 22, 26 |
| 22 | 4, 16, 18, 21 | 26 |
| 23 | 1, 5-15 | 26 |
| 24 | 4 | 7, 26 |
| 25 | 2, 4 | 26 |
| 26 | all previous | F1-F4 |

### Agent Dispatch Summary

- **Wave 1**: 4 tasks → T1-T3: `quick`, T4: `deep`
- **Wave 2**: 6 tasks → T5-T6, T8, T10: `quick`, T7, T9: `deep`
- **Wave 3**: 5 tasks → T11, T13-T14: `quick`, T12, T15: `deep`
- **Wave 4**: 6 tasks → T17, T19, T21, T24: `quick`, T16, T18, T20: `deep`
- **Wave 5**: 5 tasks → T23-T24: `quick`, T22, T25-T26: `deep`
- **Final**: 4 tasks → F1: `oracle`, F2-F3: `unspecified-high`, F4: `deep`

---

## TODOs

- [x] 1. Package Scaffolding + TypeScript Config
  **What to do**:
  - Create `packages/json-render-rezi/` directory structure
  - Initialize `package.json` with dependencies: `@json-render/core`, `@rezi-ui/core`, `@rezi-ui/node`
  - Create `tsconfig.json` extending json-render's TypeScript config
  - Create `src/index.ts` with placeholder exports
  - Create `vitest.config.ts` for test runner
  - Add npm scripts: `build`, `test`, `typecheck`

  **Must NOT do**:
  - Add React or DOM dependencies
  - Create actual implementation code (that's task 4)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard package scaffolding, well-defined structure
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Task 4, Task 17
  - **Blocked By**: None

  **References**:
  - `reference/json-render/packages/react/package.json` — Package structure and dependencies
  - `reference/json-render/packages/react/tsconfig.json` — TypeScript configuration
  - `reference/Rezi/packages/core/package.json` — Rezi's package structure

  **Acceptance Criteria**:
  - [ ] `packages/json-render-rezi/package.json` exists with correct dependencies
  - [ ] `npm run build` placeholder exits cleanly
  - [ ] `npx tsc --noEmit` passes on placeholder code

  **QA Scenarios**:
  ```
  Scenario: Package builds successfully
    Tool: Bash
    Steps:
      1. cd packages/json-render-rezi && npm run build
      2. ls dist/index.js dist/index.d.ts
    Expected Result: Both files exist
    Evidence: .sisyphus/evidence/task-01-build.txt
  ```

- [x] 2. Type Definitions from Rezi Widget Types
  **What to do**:
  - Create `src/types.ts` with TypeScript types for the renderer
  - Define `ReziComponentFn<P>` type for component render functions
  - Define `ReziComponents<C>` type for component registry
  - Define `ReziActions<C>` type for action handlers
  - Define `ReziRendererOptions` interface
  - Import and re-export relevant types from `@rezi-ui/core` (`VNode`, widget prop types)

  **Must NOT do**:
  - Define new widget types (only import from Rezi)
  - Include runtime code

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Type definitions only, no runtime logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Tasks 5-9, Task 19
  - **Blocked By**: None

  **References**:
  - `reference/Rezi/packages/core/src/widgets/types.ts` — Rezi's widget prop types
  - `reference/json-render/packages/react/src/catalog-types.ts` — json-render's component type pattern

  **Acceptance Criteria**:
  - [ ] `src/types.ts` exports `ReziComponentFn`, `ReziComponents`, `ReziActions`, `ReziRendererOptions`
  - [ ] Types import correctly from `@rezi-ui/core`

  **QA Scenarios**:
  ```
  Scenario: Types are valid TypeScript
    Tool: Bash
    Steps:
      1. npx tsc --noEmit packages/json-render-rezi/src/types.ts
    Expected Result: Exit code 0
    Evidence: .sisyphus/evidence/task-02-types.txt
  ```

- [x] 3. Schema Extension with Terminal Rules
  **What to do**:
  - Create `src/schema.ts` that re-exports json-render's React schema
  - Add terminal-specific `defaultRules` for AI prompts:
    - "TERMINAL CONSTRAINTS: Design for 80x24 viewport minimum"
    - "All interactive widgets (Button, Input, Select) require unique 'id' prop"
    - "Use single-column layouts. Avoid wide tables."
    - "Prefer scrollable content over horizontal overflow"
  - Export `ReziSchema` and `ReziSpec<TCatalog>` types

  **Must NOT do**:
  - Create entirely new schema structure
  - Add schema validation logic

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Extending existing schema with additional rules
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Task 4, Task 11, Task 12
  - **Blocked By**: None

  **References**:
  - `reference/json-render/packages/react/src/schema.ts` — Base schema to extend
  - `reference/json-render/packages/core/src/schema.ts` — `defineSchema` API

  **Acceptance Criteria**:
  - [ ] `src/schema.ts` exports `schema` with extended defaultRules
  - [ ] `schema.prompt()` includes terminal-specific rules

  **QA Scenarios**:
  ```
  Scenario: Schema includes terminal rules
    Tool: Bash
    Steps:
      1. node -e "const { schema } = require('./src/schema'); console.log(schema.defaultRules.some(r => r.includes('TERMINAL CONSTRAINTS')))"
    Expected Result: Output contains "true"
    Evidence: .sisyphus/evidence/task-03-schema.txt
  ```

- [x] 4. Core ReziRenderer Class
  **What to do**:
  - Create `src/renderer.ts` with `ReziRenderer` class
  - Implement constructor accepting `StateStore` or creating internal store
  - Implement `setSpec(spec: Spec | null)` method
  - Implement `getState()` and `setState(path, value)` methods
  - Implement `render(): VNode | null` method with:
    - Resolve root element from spec
    - Recursively render elements to VNodes
    - Handle missing elements gracefully (return null or placeholder)
  - Implement basic prop resolution (pass-through for now)

  **Must NOT do**:
  - Implement full component mapping (that's tasks 5-9)
  - Implement visibility conditions (that's task 11)
  - Implement $state resolution (that's task 12)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Core architecture, requires understanding both systems
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO — depends on Tasks 1, 3
  - **Parallel Group**: Wave 1 (sequential after T1-T3)
  - **Blocks**: Tasks 10, 13, 14, 15
  - **Blocked By**: Task 1 (scaffold), Task 3 (schema)

  **References**:
  - `reference/json-render/packages/react/src/renderer.tsx` — React renderer pattern to follow
  - `reference/json-render/packages/core/src/state-store.ts` — StateStore interface
  - `reference/Rezi/packages/core/src/widgets/ui.ts` — ui.* factory functions

  **Acceptance Criteria**:
  - [ ] `ReziRenderer` class exists with `setSpec`, `render`, `getState`, `setState` methods
  - [ ] `render()` returns `null` for empty spec
  - [ ] `render()` returns VNode for valid spec with text widget

  **QA Scenarios**:
  ```
  Scenario: Renderer handles empty spec
    Tool: Bash
    Steps:
      1. node -e "const { ReziRenderer } = require('./src/renderer'); const r = new ReziRenderer(); console.log(r.render())"
    Expected Result: Output contains "null"
    Evidence: .sisyphus/evidence/task-04-renderer-empty.txt

  Scenario: Renderer renders basic spec
    Tool: Bash
    Steps:
      1. node -e "const { ReziRenderer } = require('./src/renderer'); const r = new ReziRenderer(); r.setSpec({ root: 'a', elements: { a: { type: 'Text', props: { content: 'Hello' } } } }); console.log(r.render()?.kind)"
    Expected Result: Output contains "text"
    Evidence: .sisyphus/evidence/task-04-renderer-basic.txt
  ```

- [x] 5. Core Layout (Box, Row, Column)
  **What to do**:
  - Create `src/components/layout.ts` with mappings for core layout widgets
  - Map `Box` → `ui.box(props, children)` with preset handling
  - Map `Row` → `ui.row(props, children)` with gap default
  - Map `Column` → `ui.column(props, children)` with gap default
  - Export all layout components from `src/components/index.ts`

  **Must NOT do**:
  - Add new layout widgets not in Rezi
  - Implement complex prop transformations (keep 1:1 for now)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Straightforward prop mapping, well-defined inputs/outputs
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8, 9)
  - **Blocks**: Task 20
  - **Blocked By**: Task 2 (types)

  **References**:
  - `reference/Rezi/packages/core/src/widgets/ui.ts:220-260` — box, row, column factories
  - `reference/Rezi/packages/core/src/widgets/types.ts:150-250` — BoxProps, RowProps, ColumnProps

  **Acceptance Criteria**:
  - [ ] All 3 layout components render correctly
  - [ ] Children are passed through correctly

  **QA Scenarios**:
  ```
  Scenario: Box renders with children
    Tool: Bash
    Steps:
      1. node -e "const { Box } = require('./src/components/layout'); const r = Box({ props: { p: 1 }, children: [{ kind: 'text', text: 'Hello' }] }); console.log(r.kind)"
    Expected Result: Output contains "box"
    Evidence: .sisyphus/evidence/task-05-layout.txt
  ```

- [x] 6. Core Interactive (Text, Button, Input, Select)
  **What to do**:
  - Create `src/components/interactive.ts` with mappings for core interactive widgets
  - Map `Text` → `ui.text(content, styleOrProps)`
  - Map `Button` → `ui.button(id, label, { onPress, ...props })` with auto-ID generation
  - Map `Input` → `ui.input(id, { onInput, value, ...props })` with two-way binding
  - Map `Select` → `ui.select(id, { options, onChange, value, ...props })`

  **Must NOT do**:
  - Skip ID generation (all interactive widgets MUST have IDs)
  - Implement complex validation logic

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Requires ID generation strategy and emit() integration
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 7, 8, 9)
  - **Blocks**: Task 20
  - **Blocked By**: Task 2 (types), Task 4 (renderer), Task 18 (ID generation)

  **References**:
  - `reference/Rezi/packages/core/src/widgets/ui.ts` — text, button, input, select factories
  - `reference/Rezi/packages/core/src/widgets/types.ts:400-500` — TextProps, ButtonProps, InputProps, SelectProps
  - `reference/json-render/packages/react/src/renderer.tsx:200-250` — emit() pattern

  **Acceptance Criteria**:
  - [ ] Text renders with content
  - [ ] Button generates ID if not provided
  - [ ] Input binds to state via `bindings` prop
  - [ ] Select handles onChange via emit

  **QA Scenarios**:
  ```
  Scenario: Button has auto-generated ID
    Tool: Bash
    Steps:
      1. node -e "const { Button } = require('./src/components/interactive'); const ctx = { generateId: (t) => t + '-1' }; const r = Button({ props: { label: 'Click' }, ctx }); console.log(r.props.id)"
    Expected Result: Output contains "button-1"
    Evidence: .sisyphus/evidence/task-06-interactive.txt
  ```

- [x] 7. Advanced Widgets (Page, Panel, Table, VirtualList, Logs)
  **What to do**:
  - Create `src/components/advanced.ts` with mappings for advanced terminal widgets
  - Map `Page` → `ui.page(props, children)` for root-level wrapper
  - Map `Panel` → `ui.panel(props, children)` for section containers
  - Map `Table` → `ui.table(id, { columns, rows, ...props })`
  - Map `VirtualList` → `ui.virtualList(id, { items, renderItem, ...props })`
  - Map `Logs` → `ui.logs(id, { entries, ...props })` for log viewers

  **Must NOT do**:
  - Implement data transformation logic
  - Add new widget types

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex widgets with multiple props and patterns
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 8, 9)
  - **Blocks**: Task 20
  - **Blocked By**: Task 2 (types)

  **References**:
  - `reference/Rezi/packages/core/src/widgets/ui.ts` — page, panel, table, virtualList, logs factories
  - `reference/Rezi/packages/core/src/widgets/types.ts` — PageProps, PanelProps, TableProps

  **Acceptance Criteria**:
  - [ ] Page renders as root container
  - [ ] Table renders with columns and rows
  - [ ] VirtualList handles item rendering

  **QA Scenarios**:
  ```
  Scenario: Table renders with data
    Tool: Bash
    Steps:
      1. node -e "const { Table } = require('./src/components/advanced'); const r = Table({ props: { columns: [{ key: 'a', label: 'A' }], rows: [{ a: 1 }] } }); console.log(r.kind)"
    Expected Result: Output contains "table"
    Evidence: .sisyphus/evidence/task-07-advanced.txt
  ```

- [x] 8. Code & Visualization (CodeEditor, DiffViewer, Canvas, Charts)
  **What to do**:
  - Create `src/components/visualization.ts` with mappings for code and visualization widgets
  - Map `CodeEditor` → `ui.codeEditor(id, { value, language, onChange, ...props })`
  - Map `DiffViewer` → `ui.diffViewer(id, { original, modified, ...props })`
  - Map `Canvas` → `ui.canvas(id, { width, height, draw, ...props })`
  - Map `Charts` → `ui.lineChart()`, `ui.barChart()`, `ui.gauge()` with data props

  **Must NOT do**:
  - Implement chart rendering logic
  - Add external chart libraries

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Direct prop mapping to Rezi visualization widgets
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 7, 9)
  - **Blocks**: Task 20
  - **Blocked By**: Task 2 (types)

  **References**:
  - `reference/Rezi/packages/core/src/widgets/ui.ts` — codeEditor, diffViewer, canvas, chart factories
  - `reference/Rezi/packages/core/src/widgets/types.ts` — CodeEditorProps, DiffViewerProps, CanvasProps

  **Acceptance Criteria**:
  - [ ] CodeEditor renders with value
  - [ ] DiffViewer shows original/modified
  - [ ] Charts accept data prop correctly

  **QA Scenarios**:
  ```
  Scenario: CodeEditor renders
    Tool: Bash
    Steps:
      1. node -e "const { CodeEditor } = require('./src/components/visualization'); const r = CodeEditor({ props: { value: 'const x = 1' } }); console.log(r.kind)"
    Expected Result: Output contains "codeEditor"
    Evidence: .sisyphus/evidence/task-08-visualization.txt
  ```

- [x] 9. Overlays (Modal, Toast, CommandPalette)
  **What to do**:
  - Create `src/components/overlays.ts` with mappings for overlay widgets
  - Map `Modal` → `ui.modal(id, { title, content, onClose, ...props })`
  - Map `Toast` → Use Rezi's `addToast()` function (not a widget, but action)
  - Map `CommandPalette` → `ui.commandPalette(id, { commands, onSelect, ...props })`

  **Must NOT do**:
  - Implement overlay management logic
  - Add new overlay types

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Direct prop mapping with action integration
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 7, 8)
  - **Blocks**: Task 20
  - **Blocked By**: Task 2 (types)

  **References**:
  - `reference/Rezi/packages/core/src/widgets/ui.ts` — modal, commandPalette factories
  - `reference/Rezi/packages/core/src/widgets/toast.ts` — Toast API
  - `reference/Rezi/packages/core/src/widgets/types.ts` — ModalProps, CommandPaletteProps

  **Acceptance Criteria**:
  - [ ] Modal renders with title and content
  - [ ] Toast action is available
  - [ ] CommandPalette renders with commands

- [x] 10. State Management Integration
  **What to do**:
  - Integrate json-render's `StateStore` with `ReziRenderer`
  - Store should be single source of truth for all `$state` bindings
  - Implement `subscribe(listener)` pattern for reactive updates
  - Ensure state updates queue through Rezi's update pattern (avoid update during render)
  - Add `onStateChange` callback option to renderer

  **Must NOT do**:
  - Create parallel state system
  - Allow direct mutation of state

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Critical integration point, affects all other features
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO — depends on Task 4
  - **Parallel Group**: Wave 3 (sequential after T4)
  - **Blocks**: Tasks 13, 16
  - **Blocked By**: Task 4 (renderer core)

  **References**:
  - `reference/json-render/packages/core/src/state-store.ts` — StateStore implementation
  - `reference/Rezi/packages/core/src/app/createApp.ts:800-900` — Rezi's update queue pattern

  **Acceptance Criteria**:
  - [ ] State changes trigger re-render
  - [ ] `$state` bindings read from store correctly
  - [ ] No state updates during render phase

  **QA Scenarios**:
  ```
  Scenario: State binding resolves
    Tool: Bash
    Steps:
      1. node -e "const { ReziRenderer } = require('./src/renderer'); const r = new ReziRenderer({ initialState: { count: 5 } }); r.setSpec({ root: 'a', elements: { a: { type: 'Text', props: { content: { $state: '/count' } } } } }); const v = r.render(); console.log(v.text)"
    Expected Result: Output contains "5"
    Evidence: .sisyphus/evidence/task-10-state.txt
  ```

- [x] 11. Visibility Condition Evaluation
  **What to do**:
  - Implement `evaluateVisibility()` from json-render for Rezi renderer
  - Support all condition types: `$state`, `$item`, `$index`
  - Support comparison operators: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `not`
  - Support logical operators: `$and`, `$or`
  - Skip rendering elements where `visible` evaluates to false

  **Must NOT do**:
  - Implement new condition types
  - Add async visibility evaluation

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Port existing json-render visibility logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 12, 14)
  - **Blocks**: Task 14
  - **Blocked By**: Task 3 (schema)

  **References**:
  - `reference/json-render/packages/core/src/visibility.ts` — Full visibility implementation
  - `reference/json-render/packages/react/src/renderer.tsx:190-200` — Visibility check pattern

  **Acceptance Criteria**:
  - [ ] Elements with `visible: false` are not rendered
  - [ ] `$state` conditions evaluate correctly
  - [ ] `$and`/`$or` logic works

  **QA Scenarios**:
  ```
  Scenario: Visibility hides element
    Tool: Bash
    Steps:
      1. node -e "const { ReziRenderer } = require('./src/renderer'); const r = new ReziRenderer({ initialState: { show: false } }); r.setSpec({ root: 'a', elements: { a: { type: 'Text', props: { content: 'Hidden' }, visible: { $state: '/show' } } } }); console.log(r.render())"
    Expected Result: Output contains "null"
    Evidence: .sisyphus/evidence/task-11-visibility.txt
  ```

- [x] 12. Prop Resolution ($state, $item, $index)
  **What to do**:
  - Implement `resolveElementProps()` from json-render for Rezi
  - Support `$state: "/path"` → resolve from StateStore
  - Support `$item: "field"` → resolve from repeat item
  - Support `$index: true` → resolve from repeat index
  - Support `$cond` conditional expressions
  - Support `$bindState` and `$bindItem` for two-way binding

  **Must NOT do**:
  - Add new expression types
  - Implement async prop resolution

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Port existing json-render prop resolution
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 11, 14)
  - **Blocks**: Task 10, Task 14
  - **Blocked By**: Task 3 (schema)

  **References**:
  - `reference/json-render/packages/core/src/props.ts` — Prop resolution implementation
  - `reference/json-render/packages/react/src/renderer.tsx:330-340` — Prop resolution usage

  **Acceptance Criteria**:
  - [ ] `$state` props resolve from store
  - [ ] `$item` props resolve in repeat scope
  - [ ] `$cond` expressions evaluate correctly

- [x] 13. Action Handlers (setState, focus, toast, quit)
  **What to do**:
  - Create `src/actions.ts` with built-in action handlers
  - `setState` → Update StateStore via renderer.setState()
  - `pushState` → Append to array in StateStore
  - `removeState` → Remove from array in StateStore
  - `focus` → Call Rezi focus API (if available)
  - `toast` → Use Rezi's `addToast()` function
  - `quit` → Call `app.stop()` via callback
  - `navigate` → Router navigation via callback
  - Allow user to override handlers via options

  **Must NOT do**:
  - Implement actions that require external dependencies
  - Hardcode app instance reference

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Requires understanding Rezi's action model and callbacks
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO — depends on Task 10
  - **Parallel Group**: Wave 3 (sequential after T10)
  - **Blocks**: Tasks 16, 20
  - **Blocked By**: Task 10 (state management)

  **References**:
  - `reference/json-render/packages/core/src/actions.ts` — Action execution pattern
  - `reference/Rezi/packages/core/src/widgets/toast.ts` — Toast API
  - `reference/Rezi/packages/core/src/app/createApp.ts` — App lifecycle

  **Acceptance Criteria**:
  - [ ] `setState` updates store correctly
  - [ ] Custom handlers can override defaults
  - [ ] Terminal-specific actions (toast, quit) work

  **QA Scenarios**:
  ```
  Scenario: setState action works
    Tool: Bash
    Steps:
      1. node -e "const { ReziRenderer } = require('./src/renderer'); const r = new ReziRenderer(); r.executeAction({ action: 'setState', params: { statePath: '/count', value: 10 } }); console.log(r.getState().count)"
    Expected Result: Output contains "10"
    Evidence: .sisyphus/evidence/task-13-actions.txt
  ```

- [x] 14. Event Bindings and emit()
  **What to do**:
  - Implement `emit(eventName)` function in renderer context
  - Resolve `element.on[eventName]` to action bindings
  - Execute action when emit is called from component
  - Support multiple actions per event (array)
  - Pass `on(eventName)` function returning `EventHandle` with metadata

  **Must NOT do**:
  - Implement new event types
  - Add event bubbling

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Wire up existing event pattern
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 11, 12)
  - **Blocks**: Task 20
  - **Blocked By**: Task 4 (renderer), Task 11 (visibility), Task 12 (prop resolution)

  **References**:
  - `reference/json-render/packages/react/src/renderer.tsx:200-240` — emit() and on() implementation

  **Acceptance Criteria**:
  - [ ] `emit('press')` executes bound action
  - [ ] `on('press').bound` returns true if handler exists

- [x] 15. SpecStream Integration for Streaming AI Specs
  **What to do**:
  - Create `src/streaming.ts` with SpecStream integration
  - Implement `createStreamingRenderer(options)` that wraps `ReziRenderer`
  - Use `createSpecStreamCompiler<Spec>()` from `@json-render/core`
  - Implement progressive rendering:
    ```typescript
    const compiler = createSpecStreamCompiler<Spec>();
    for await (const chunk of aiStream) {
      const { result } = compiler.push(chunk);
      renderer.setSpec(result); // Triggers Rezi re-render
    }
    ```
  - Integrate with Rezi's hot reload hooks (`app.replaceView()`)
  - Handle partial/invalid specs gracefully during streaming

  **Must NOT do**:
  - Implement custom spec parsing (use json-render's compiler)
  - Block the event loop during streaming

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Integrates streaming compiler with Rezi's deterministic rendering
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO — depends on Task 4
  - **Parallel Group**: Wave 4 (sequential after T4)
  - **Blocks**: Task 16, Task 20
  - **Blocked By**: Task 4 (renderer core)

  **References**:
  - `reference/json-render/packages/core/src/index.ts` — createSpecStreamCompiler API
  - `reference/Rezi/packages/core/src/app/createApp.ts` — replaceView() for hot reload
  - `reference/Rezi/CHANGELOG.md` — Hot state-preserving reload feature

  **Acceptance Criteria**:
  - [ ] `createStreamingRenderer()` returns streaming renderer
  - [ ] Progressive spec updates trigger re-renders
  - [ ] Invalid partial specs don't crash the renderer

  **QA Scenarios**:
  ```
  Scenario: Streaming renderer handles progressive updates
    Tool: Bash
    Steps:
      1. node -e "const { createStreamingRenderer } = require('./src/streaming'); const r = createStreamingRenderer(); r.push('{ \"root\": \"a\"'); r.push(', \"elements\": { \"a\": { \"type\": \"Text\", \"props\": { \"content\": \"Hi\" } } } }'); console.log(r.render()?.kind)"
    Expected Result: Output contains "text"
    Evidence: .sisyphus/evidence/task-15-streaming.txt
  ```

- [x] 16. createNodeApp Integration Helper
  **What to do**:
  - Create `src/integration.ts` with helper for Rezi app setup
  - Export `createReziApp(options)` that combines:
    - `createNodeApp()` from `@rezi-ui/node`
    - `ReziRenderer` setup
    - Auto-wiring view function to renderer.render()
    - Optional hot reload integration
  - Export `useRenderer()` hook for accessing renderer from custom widgets

  **Must NOT do**:
  - Require specific app structure
  - Force particular state management

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Integrates multiple systems, needs careful API design
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO — depends on Tasks 4, 10, 13, 15
  - **Parallel Group**: Wave 4 (sequential after T10, T13, T15)
  - **Blocks**: Task 20
  - **Blocked By**: Task 4 (renderer), Task 10 (state), Task 13 (actions), Task 15 (streaming)

  **References**:
  - `reference/Rezi/packages/node/src/index.ts:230-280` — createNodeApp pattern
  - `reference/json-render/packages/react/src/renderer.tsx:520-560` — Provider pattern

  **Acceptance Criteria**:
  - [ ] `createReziApp()` returns working app instance
  - [ ] App view renders spec correctly

  **QA Scenarios**:
  ```
  Scenario: App integration works
    Tool: interactive_bash (tmux)
    Steps:
      1. Create test file that uses createReziApp
      2. Run and verify terminal output
    Expected Result: App starts and renders
    Evidence: .sisyphus/evidence/task-16-integration.txt
  ```

- [x] 17. defineReziRegistry API
  **What to do**:
  - Create `src/registry.ts` with `defineReziRegistry()` function
  - Accept catalog and options object
  - Return `{ components, actions, createRenderer }`
  - Merge user-provided components with defaults
  - Type-safe component registration matching catalog types

  **Must NOT do**:
  - Allow invalid component types
  - Skip type checking

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: API wrapper around existing functionality
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 18, 19)
  - **Blocks**: Task 20
  - **Blocked By**: Task 1 (package scaffold)

  **References**:
  - `reference/json-render/packages/react/src/renderer.tsx:640-720` — defineRegistry pattern

  **Acceptance Criteria**:
  - [ ] `defineReziRegistry()` returns typed registry
  - [ ] Custom components override defaults

- [x] 18. ID Generation Strategy
  **What to do**:
  - Implement deterministic ID generation for widgets without explicit `id`
  - Use element key path as base: `element-key--button`
  - Support `ctx.id(prefix)` pattern for repeat scopes
  - Generate unique IDs that are stable across renders
  - Add `requiresId` flag to component definitions

  **Must NOT do**:
  - Use random IDs (breaks determinism)
  - Generate IDs for non-interactive widgets

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Well-defined ID generation logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 17, 19)
  - **Blocks**: Task 6, Task 20
  - **Blocked By**: Task 4 (renderer)

  **References**:
  - `reference/Rezi/packages/core/src/widgets/composition.ts:80-100` — ctx.id() pattern
  - `reference/Rezi/packages/core/src/widgets/protocol.ts` — kindRequiresId()

  **Acceptance Criteria**:
  - [ ] IDs are deterministic (same spec = same IDs)
  - [ ] Repeat items get unique IDs

- [x] 19. Error Handling and Fallbacks
  **What to do**:
  - Implement error boundary pattern for element rendering
  - Wrap each element render in try-catch
  - Log errors to console with context (element type, key)
  - Return fallback widget for failed renders
  - Support `fallback` option in renderer config
  - Handle missing elements gracefully

  **Must NOT do**:
  - Crash app on single element failure
  - Swallow errors silently

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Requires understanding error recovery patterns
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 17, 18)
  - **Blocks**: Task 20
  - **Blocked By**: Task 2 (types), Task 4 (renderer)

  **References**:
  - `reference/json-render/packages/react/src/renderer.tsx:96-140` — ElementErrorBoundary pattern
  - `reference/Rezi/packages/core/src/abi.ts` — Error codes

  **Acceptance Criteria**:
  - [ ] Failed elements don't crash app
  - [ ] Errors are logged with context

- [x] 20. Full Test Suite
  **What to do**:
  - Create `src/__tests__/` directory
  - Add unit tests for:
    - ReziRenderer class
    - Each component mapping
    - State management
    - Visibility conditions
    - Prop resolution
    - Action handlers
    - **SpecStream integration**
  - Add integration test with sample spec rendering
  - Configure Vitest coverage reporting

  **Must NOT do**:
  - Skip edge case tests
  - Use real terminal for unit tests

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Comprehensive test coverage requires understanding all components
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO — depends on all previous tasks
  - **Parallel Group**: Wave 4 (sequential after all)
  - **Blocks**: F1-F4
  - **Blocked By**: All previous tasks

  **References**:
  - `reference/json-render/packages/react/src/__tests__/` — Test patterns
  - `reference/Rezi/packages/core/src/__tests__/` — Rezi test patterns

  **Acceptance Criteria**:
  - [ ] All tests pass
  - [ ] Coverage > 80%

  **QA Scenarios**:
  ```
  Scenario: Full test suite passes
    Tool: Bash
    Steps:
      1. cd packages/json-render-rezi && bun test
    Expected Result: All tests pass, exit code 0
    Evidence: .sisyphus/evidence/task-20-tests.txt
  ```

---

- [x] 21. Update package.json name and repository
  **What to do**:
  - Change `name` from `@json-render/rezi` to `@cbrunnkvist/json-render-rezitui`
  - Update `repository.url` to `git+https://github.com/cbrunnkvist/json-render-rezitui.git`
  - Update `homepage` and `bugs.url` accordingly

  **Must NOT do**:
  - Change version number
  - Modify dependencies or scripts

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple JSON file edit
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 6
  - **Blocks**: Tasks 22, 23, 24
  - **Blocked By**: None

  **References**:
  - `packages/json-render-rezi/package.json` - Current file to modify

  **Acceptance Criteria**:
  - [ ] `name` field is `@cbrunnkvist/json-render-rezitui`
  - [ ] `repository.url` points to correct GitHub URL

  **QA Scenarios**:
  ```
  Scenario: Package.json updated correctly
    Tool: Bash
    Steps:
      1. cd packages/json-render-rezi && cat package.json | grep '"name"'
    Expected Result: Correct name
    Evidence: .sisyphus/evidence/task-21-package.json
  ```

- [x] 22. Update README.md and documentation
  **What to do**:
  - Change installation command from `@json-render/rezi` to `@cbrunnkvist/json-render-rezitui`
  - Update any references in documentation

  **Must NOT do**:
  - Modify other documentation content

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple text replacement
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 6
  - **Blocks**: Tasks 23, 24
  - **Blocked By**: Task 21

  **References**:
  - `packages/json-render-rezi/README.md` - Current file to modify
  - `README.md` - Main repository README

  **Acceptance Criteria**:
  - [ ] Installation command updated in both READMEs

  **QA Scenarios**:
  ```
  Scenario: READMEs updated
    Tool: Bash
    Steps:
      1. grep 'npm install' README.md packages/json-render-rezi/README.md
    Expected Result: Correct name in both
    Evidence: .sisyphus/evidence/task-22-readme.txt
  ```

- [x] 23. Update example app imports and dependencies
  **What to do**:
  - Change import statements in all examples from `@json-render/rezi` to `json-render-rezitui`

  **Must NOT do**:
  - Modify other example code

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple import statement edit
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 6
  - **Blocks**: Task 24
  - **Blocked By**: Task 21

  **References**:
  - `examples/` directory

  **Acceptance Criteria**:
  - [ ] All examples use `json-render-rezitui` for imports

  **QA Scenarios**:
  ```
  Scenario: Example imports verified
    Tool: Bash
    Steps:
      1. grep -r "json-render-rezitui" examples/
    Expected Result: Multiple matches found
    Evidence: .sisyphus/evidence/task-23-examples.txt
  ```

- [x] 24. Global verification
  **What to do**:
  - Search entire codebase for any remaining `@json-render/rezi` references
  - Ensure complete cleanup

  **Must NOT do**:
  - Make changes without verification

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Thorough search and verification
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 6
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 21, 22, 23

  **References**:
  - Entire codebase

  **Acceptance Criteria**:
  - [ ] Zero occurrences of `@json-render/rezi` found

  **QA Scenarios**:
  ```
  Scenario: No remaining old references
    Tool: Bash
    Steps:
      1. grep -r "@json-render/rezi" . --exclude-dir=node_modules
    Expected Result: No matches
    Evidence: .sisyphus/evidence/task-24-verify.txt
  ```


## Final Verification Wave

- [x] F1. **Plan Compliance Audit** — `oracle`
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill if UI)
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1 complete**: `feat(json-render-rezitui): add package scaffold and core renderer`
- **Wave 2 complete**: `feat(json-render-rezitui): add component mappings for curated terminal widgets`
- **Wave 3 complete**: `feat(json-render-rezitui): add state management and action handlers`
- **Wave 4-5 complete**: `feat(json-render-rezitui): add SpecStream, integration, and full test suite`
- **Wave 6 complete**: `feat(json-render-rezitui): rename package to personal namespace and update references`

---

## Success Criteria

### Verification Commands
```bash
# Build succeeds
cd packages/json-render-rezi && npm run build
# Expected: dist/index.js, dist/index.d.ts exist

# Type checking passes
npx tsc --noEmit
# Expected: Exit code 0

# Tests pass
bun test
# Expected: All tests pass

# Basic rendering works
bun test --grep "renderer"
# Expected: Renderer tests pass
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] Example app works
- [ ] TypeScript types export correctly
