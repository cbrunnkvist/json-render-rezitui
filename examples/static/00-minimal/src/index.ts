import { createNodeApp } from "@rezi-ui/node";
import { ui } from "@rezi-ui/core";
import { createRenderer } from "@cbrunnkvist/json-render-rezitui";

async function main() {
  // 1. Create a raw Rezi NodeApp
  const nodeApp = createNodeApp({
    initialState: {}
  });

  // 2. Create our renderer manually
  const renderer = createRenderer({
    debug: true
  });

  // 3. Set a minimalist spec
  renderer.setSpec({
    root: "container",
    elements: {
      container: {
        type: "Column",
        props: {
          width: "100%",
          height: "100%",
          align: "center",
          justify: "center",
        },
        children: ["row"]
      },
      row: {
        type: "Row",
        props: { gap: 1, align: "center" },
        children: ["spinner", "label"]
      },
      spinner: {
        type: "Spinner",
        props: { variant: "dots", color: { r: 0, g: 255, b: 0 } }
      },
      label: {
        type: "Text",
        props: {
          content: "Minimal Test: This should be BRIGHT GREEN",
          color: { r: 0, g: 255, b: 0 },
          bold: true
        }
      }
    }
  });

  // 4. Wire the view directly
  nodeApp.view(() => {
    return renderer.render() || ui.text("Renderer returned null");
  });

  // 5. Start the app loop manually
  console.error("Starting minimal test...");
  await nodeApp.start();

  // Keep it alive manually
  const timer = setTimeout(async () => {
    console.error("5 seconds elapsed, stopping...");
    await nodeApp.stop();
    process.exit(0);
  }, 5000);
}

main().catch(err => {
  console.error("Fatal error in minimal test:", err);
  process.exit(1);
});
