/**
 * Counter Example
 * 
 * Demonstrates interactive state management with json-render-rezitui.
 * Shows how actions modify state and trigger re-renders.
 */

import { createReziApp } from "@cbrunnkvist/json-render-rezitui";

// Define the spec with state and actions
const spec = {
  root: "main",
  elements: {
    main: {
      type: "Column",
      props: {},
      children: ["header", "counter-display", "controls", "step-control", "info"]
    },
    header: {
      type: "Box",
      props: {
        padding: 1,
        border: "double"
      },
      children: ["title"]
    },
    title: {
      type: "Text",
      props: {
        content: "🧮 Interactive Counter",
        bold: true,
        color: "cyan",
        align: "center"
      }
    },
    "counter-display": {
      type: "Box",
      props: {
        padding: 2,
        margin: 1
      },
      children: ["count-text", "count-label"]
    },
    "count-text": {
      type: "Text",
      props: {
        content: { $state: "/count" },
        bold: true,
        color: { $cond: { $state: "/count", gt: 0, then: "green", else: { $cond: { $state: "/count", lt: 0, then: "red", else: "white" } } } },
        align: "center"
      }
    },
    "count-label": {
      type: "Text",
      props: {
        content: "Current Count",
        color: "gray",
        align: "center"
      }
    },
    controls: {
      type: "Row",
      props: {
        gap: 2,
        justifyContent: "center",
        padding: 1
      },
      children: ["decrement-btn", "reset-btn", "increment-btn"]
    },
    "decrement-btn": {
      type: "Button",
      props: {
        id: "decrement-btn",
        label: "➖ Decrement"
      },
      on: {
        press: {
          action: "setState",
          params: {
            path: "/count",
            value: { $template: "${count - step}" }
          }
        }
      }
    },
    "reset-btn": {
      type: "Button",
      props: {
        id: "reset-btn",
        label: "🔄 Reset",
        intent: "secondary"
      },
      on: {
        press: {
          action: "setState",
          params: {
            path: "/count",
            value: 0
          }
        }
      }
    },
    "increment-btn": {
      type: "Button",
      props: {
        id: "increment-btn",
        label: "➕ Increment"
      },
      on: {
        press: {
          action: "setState",
          params: {
            path: "/count",
            value: { $template: "${count + step}" }
          }
        }
      }
    },
    "step-control": {
      type: "Row",
      props: {
        gap: 1,
        padding: 1,
        justifyContent: "center"
      },
      children: ["step-label", "step-input"]
    },
    "step-label": {
      type: "Text",
      props: {
        content: "Step size:"
      }
    },
    "step-input": {
      type: "Input",
      props: {
        id: "step-input",
        type: "number",
        value: { $state: "/step" },
        bindings: {
          value: "/step"
        }
      }
    },
    info: {
      type: "Box",
      props: {
        padding: 1,
        marginTop: 2
      },
      children: ["info-text"]
    },
    "info-text": {
      type: "Text",
      props: {
        content: "💡 Try changing the step size and clicking the buttons!",
        color: "dim"
      }
    }
  },
  state: {
    count: 0,
    step: 1
  }
};


async function main() {
  console.log("Starting Counter example...\n");

  const app = createReziApp({
    spec,
    initialState: { count: 0, step: 1 },
    debug: false
  });

  // Log state changes for demonstration
  const originalSetState = app.renderer.setState.bind(app.renderer);
  app.renderer.setState = (path, value) => {
    console.log(`[State Change] ${path} = ${JSON.stringify(value)}`);
    return originalSetState(path, value);
  };

  await app.run();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
