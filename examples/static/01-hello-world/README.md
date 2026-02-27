# Hello World Example

The simplest possible `@cbrunnkvist/json-render-rezitui` application.

## What It Demonstrates

- ✅ Static spec rendering (no state)
- ✅ Box layout with border styling
- ✅ Text styling (bold, colors)
- ✅ Nested Column layouts
- ✅ Basic app structure

## Running

```bash
pnpm install
pnpm start
```

## The Spec

```typescript
const spec = {
  catalog: "core",
  elements: [
    {
      key: "header",
      type: "Box",
      props: { padding: 2, border: "single" },
      children: [
        { key: "title", type: "Text", props: { content: "Hello!", bold: true } }
      ]
    }
  ]
};
```

## Key Concepts

1. **Spec Structure**: Every spec needs `catalog` and `elements`
2. **Element Keys**: Each element must have a unique `key`
3. **Type Mapping**: `type: "Box"` maps to Rezi's `ui.box()`
4. **Props**: Passed directly to the underlying widget
5. **Children**: Nested elements rendered inside parent

## Output

```
┌──────────────────────────────────────┐
│  👋 Hello from @cbrunnkvist/json-render-rezitui!    │
│  This is a static spec...            │
└──────────────────────────────────────┘

Features demonstrated:
  ✓ Static spec rendering
  ✓ Box layout with border
  ✓ Text styling (bold, colors)
  ✓ Nested Column layouts

Press Ctrl+C to exit
```
