/**
 * Hello World Example
 * 
 * The simplest possible json-render-rezitui application.
 * Demonstrates basic spec rendering without state or interactivity.
 */

import { createReziApp } from "json-render-rezitui";

// Define a simple static spec
const spec = {
  catalog: "core",
  elements: [
    {
      key: "header",
      type: "Box",
      props: {
        padding: 2,
        border: "single"
      },
      children: [
        {
          key: "title",
          type: "Text",
          props: {
            content: "👋 Hello from json-render-rezitui!",
            bold: true,
            color: "cyan"
          }
        },
        {
          key: "subtitle",
          type: "Text",
          props: {
            content: "This is a static spec rendered to terminal UI.",
            color: "gray"
          }
        }
      ]
    },
    {
      key: "content",
      type: "Column",
      props: {
        gap: 1,
        padding: 1
      },
      children: [
        {
          key: "intro",
          type: "Text",
          props: {
            content: "Features demonstrated:"
          }
        },
        {
          key: "features",
          type: "Column",
          props: {
            gap: 0
          },
          children: [
            {
              key: "f1",
              type: "Text",
              props: { content: "  ✓ Static spec rendering" }
            },
            {
              key: "f2",
              type: "Text",
              props: { content: "  ✓ Box layout with border" }
            },
            {
              key: "f3",
              type: "Text",
              props: { content: "  ✓ Text styling (bold, colors)" }
            },
            {
              key: "f4",
              type: "Text",
              props: { content: "  ✓ Nested Column layouts" }
            }
          ]
        }
      ]
    },
    {
      key: "footer",
      type: "Box",
      props: {
        padding: 1,
        alignItems: "center"
      },
      children: [
        {
          key: "hint",
          type: "Text",
          props: {
            content: "Press Ctrl+C to exit",
            color: "dim"
          }
        }
      ]
    }
  ]
};

async function main() {
  console.log("Starting Hello World example...\n");

  // Create the Rezi app with our spec
  const app = createReziApp({
    spec,
    debug: false
  });

  // Run the app
  await app.run();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
