# @cbrunnkvist/json-render-rezitui

Rezi UI renderer for @json-render/core. Turn JSON specs into terminal UI components with state binding, visibility conditions, and actions.

## Installation

```bash
npm install @cbrunnkvist/json-render-rezitui @json-render/core @rezi-ui/core @rezi-ui/node zod
```

## Quick Start

### 1. Create a Catalog

```typescript
import { defineCatalog } from "@json-render/core";
import { schema } from "json-render-rezitui/schema";
import { z } from "zod";

export const catalog = defineCatalog(schema, {
  components: {
    Panel: {
      props: z.object({
        title: z.string(),
      }),
      description: "A titled panel container",
    },
    Button: {
      props: z.object({
        label: z.string(),
        action: z.string(),
      }),
      description: "A clickable button",
    },
    Input: {
      props: z.object({
        value: z.union([z.string(), z.record(z.unknown())]).nullable(),
        label: z.string(),
        placeholder: z.string().nullable(),
      }),
      description: "Text input field with optional value binding",
    },
  },
  actions: {
    submit: { description: "Submit the form" },
    cancel: { description: "Cancel and close" },
  },
});
```

### 2. Define Component Implementations

```typescript
import { defineReziRegistry } from "json-render-rezitui";
import { ui } from "@rezi-ui/core";
import { catalog } from "./catalog";

export const { registry } = defineReziRegistry(catalog, {
  components: {
    Panel: ({ props, children }) =>
      ui.panel(props.title, children ?? []),
    
    Button: ({ props, emit }) =>
      ui.button({
        label: props.label,
        id: props.id,
        onPress: () => emit("press"),
      }),
    
    Input: ({ props, bindings }) =>
      ui.input({
        id: props.id,
        value: props.value ?? "",
        label: props.label,
        placeholder: props.placeholder ?? undefined,
        onInput: (value) => {
          if (bindings?.value) {
            // Update bound state
          }
        },
      }),
  },
});
```

### 3. Render Specs

```typescript
import { createReziApp } from "json-render-rezitui";
import { registry } from "./registry";

const app = createReziApp({
  registry,
  spec: {
    root: "panel-1",
    elements: {
      "panel-1": {
        type: "Panel",
        props: { title: "Welcome" },
        children: ["input-1", "btn-1"],
      },
      "input-1": {
        type: "Input",
        props: {
          value: { "$bindState": "/form/name" },
          label: "Name",
          placeholder: "Enter name",
        },
      },
      "btn-1": {
        type: "Button",
        props: { label: "Submit" },
        on: {
          press: { action: "submit" },
        },
      },
    },
  },
  initialState: { form: { name: "" } },
  actions: {
    submit: () => console.log("Submit!"),
  },
});

app.start();
```

## Spec Format

The Rezi renderer uses a flat element map format:

```typescript
interface Spec {
  root: string;                          // Key of the root element
  elements: Record<string, UIElement>;   // Flat map of elements by key
  state?: Record<string, unknown>;       // Optional initial state
}

interface UIElement {
  type: string;                          // Component name from catalog
  props: Record<string, unknown>;        // Component props
  children?: string[];                   // Keys of child elements
  visible?: VisibilityCondition;         // Visibility condition
  on?: Record<string, ActionHandle>;     // Event handlers
}
```

## State Management

```typescript
const app = createReziApp({
  registry,
  spec,
  initialState: { count: 0 },
});

// Access and modify state
app.setState("/count", 5);
app.updateState((state) => ({ ...state, count: state.count + 1 }));
```

## Visibility Conditions

```typescript
// Truthiness check
{ "$state": "/user/isAdmin" }

// Comparisons
{ "$state": "/status", "eq": "active" }
{ "$state": "/count", "gt": 10 }

// Negation
{ "$state": "/maintenance", "not": true }

// Always / never
true   // always visible
false  // never visible
```

## Actions

Components can trigger actions on events:

```typescript
{
  "type": "Button",
  "props": { "label": "Submit" },
  "on": {
    "press": {
      "action": "setState",
      "params": { "statePath": "/submitted", "value": true }
    }
  }
}
```

Built-in actions:
- `setState` - Set a state value at a path
- `pushState` - Push to an array at a path
- `removeState` - Remove from an array at a path

## Streaming

Stream specs from an API:

```typescript
import { SpecStream } from "json-render-rezitui";

const stream = new SpecStream({
  url: "/api/chat",
  onUpdate: (spec) => app.updateSpec(spec),
});

stream.start();
```

## Key Exports

| Export | Purpose |
|--------|---------|
| `defineReziRegistry` | Create a type-safe component registry from a catalog |
| `createReziApp` | Create and configure a Rezi TUI application |
| `ReziRenderer` | Core renderer class |
| `SpecStream` | Stream specs from an endpoint |
| `schema` | Element tree schema with terminal-specific rules |

## Examples

See the `/examples` directory for complete working applications:

- `01-hello-world` - Minimal static UI
- `02-counter` - Interactive counter with state
- `05-system-dashboard` - Real-time system monitoring
- `11-ai-chat` - Chat with streaming AI responses

## License

Apache-2.0
