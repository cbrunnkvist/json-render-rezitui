# @cbrunnkvist/json-render-rezitui

Render JSON specs to terminal UI using [Rezi](https://rezitui.dev). Built on top of [`@json-render/core`](https://github.com/vercel-labs/json-render).

## What is this?

A renderer that turns JSON UI specifications into interactive terminal applications. Define your UI as JSON, render it as a TUI.

```typescript
import { createReziApp } from "@cbrunnkvist/json-render-rezitui";

const app = createReziApp({
  spec: {
    root: "main",
    elements: {
      main: {
        type: "Box",
        props: { padding: 2 },
        children: ["greeting"]
      },
      greeting: {
        type: "Text", 
        props: { content: "Hello, Terminal!" }
      }
    }
  }
});

await app.run();
```

## Installation

```bash
npm install @cbrunnkvist/json-render-rezitui @rezi-ui/core @rezi-ui/node
```

## Documentation

- **[Package README](./packages/json-render-rezitui/README.md)** - API reference, usage guide
- **[Examples](./examples/README.md)** - Example applications
- **[json-render/core](https://github.com/vercel-labs/json-render/tree/main/packages/core)** - Core spec format and schemas

## Examples

See the [`examples/`](./examples/) directory for working applications:

```bash
cd examples/01-hello-world
pnpm install
pnpm start
```

## Repository Structure

This is a pnpm workspace monorepo:

- `packages/` - Published packages
- `examples/` - Example applications
- `reference/` - Development references (not shipped)

## License

Apache-2.0
