/**
 * Hello World Example
 * 
 * The simplest possible json-render-rezitui application.
 * Demonstrates basic spec rendering without state or interactivity.
 */

import { createReziApp } from "@cbrunnkvist/json-render-rezitui";

// Define a simple static spec
const spec = {
  root: "main",
  elements: {
    main: {
      type: "Column",
      props: {
        gap: 1
      },
      children: ["header", "content", "footer"]
    },
    header: {
      type: "Box",
      props: {
        padding: 2,
        border: "single"
      },
      children: ["title", "subtitle"]
    },
    title: {
      type: "Text",
      props: {
        content: "👋 Hello from json-render-rezitui!",
        bold: true,
        color: "cyan"
      }
    },
    subtitle: {
      type: "Text",
      props: {
        content: "This is a static spec rendered to terminal UI.",
        color: "gray"
      }
    },
    content: {
      type: "Column",
      props: {
        gap: 1,
        padding: 1
      },
      children: ["intro", "features"]
    },
    intro: {
      type: "Text",
      props: {
        content: "Features demonstrated:"
      }
    },
    features: {
      type: "Column",
      props: {
        gap: 0
      },
      children: ["f1", "f2", "f3", "f4"]
    },
    f1: {
      type: "Text",
      props: { content: "  ✓ Static spec rendering" }
    },
    f2: {
      type: "Text",
      props: { content: "  ✓ Box layout with border" }
    },
    f3: {
      type: "Text",
      props: { content: "  ✓ Text styling (bold, colors)" }
    },
    f4: {
      type: "Text",
      props: { content: "  ✓ Nested Column layouts" }
    },
    footer: {
      type: "Box",
      props: {
        padding: 1,
        alignItems: "center"
      },
      children: ["hint"]
    },
    hint: {
      type: "Text",
      props: {
        content: "Press Ctrl+C to exit",
        color: "dim"
      }
    }
  }
};

async function main() {
  console.log("Starting Hello World example...\n");

  // Create the Rezi app with our spec
  const app = createReziApp({
    spec,
    initialState: {},
    debug: false
  });

  // Run the app
  await app.run();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
