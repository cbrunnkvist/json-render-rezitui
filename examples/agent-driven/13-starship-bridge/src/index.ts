import "dotenv/config";
import { createReziApp, createStreamingRenderer } from "@cbrunnkvist/json-render-rezitui";
import type { Spec } from "@json-render/core";

// 1. Environment Validation
if (!process.env.OPENCODE_API_KEY || !process.env.OPENCODE_MODEL) {
  console.error(
    "Error: OPENCODE_API_KEY and OPENCODE_MODEL must be set in your environment.",
  );
  process.exit(1);
}

const OPENCODE_API_KEY = process.env.OPENCODE_API_KEY;
const OPENCODE_MODEL = process.env.OPENCODE_MODEL;

// 2. Streaming Client (reused from 12-prompt-playground)
async function* getAiStream(
  prompt: string,
  signal: AbortSignal,
): AsyncGenerator<string> {
  const urls = [
    "https://api.opencode.com/v1/responses",
    "https://api.opencode.com/v1/chat/completions",
  ];
  let response: Response | null = null;
  let lastError: Error | null = null;

  for (const url of urls) {
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENCODE_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENCODE_MODEL,
          messages: [{ role: "user", content: prompt }],
          stream: true,
        }),
        signal,
      });
      if (response.ok) {
        lastError = null;
        break;
      }
      lastError = new Error(
        `API request failed with status ${response.status}: ${await response.text()}`,
      );
    } catch (error: any) {
      if (error.name === "AbortError") {
        return;
      }
      lastError = error as Error;
    }
  }

  if (!response || !response.ok || !response.body) {
    throw lastError || new Error("Failed to get a valid response from API.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.substring(6).trim();
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data);
          const content =
            parsed.choices?.[0]?.delta?.content ?? parsed.content ?? "";
          if (content) yield content;
        } catch (e) {
          // Ignore json parse errors on partial data
        }
      }
    }
  }
}

// 3. Host UI Shell
const initialSpec: Spec = {
  root: "starship-main",
  state: {
    shipName: "USS Rezi",
    status: "All systems nominal.",
    powerLevel: 100,
    isStreaming: false,
    error: null,
  },
  elements: {
    "starship-main": {
      type: "Column",
      props: { gap: 1, padding: 1, border: "double", borderColor: "blue" },
      children: ["starship-header", "starship-body"],
    },
    "starship-header": {
      type: "Text",
      props: {
        content: "🚀 Starship Bridge Control",
        bold: true,
        color: "cyan",
        align: "center",
      },
    },
    "starship-body": {
      type: "Row",
      props: { gap: 1 },
      children: ["starship-telemetry-panel", "starship-ai-layout-panel"],
    },
    "starship-telemetry-panel": {
      type: "Panel",
      props: { title: "Telemetry", width: "30%", border: "single" },
      children: ["starship-telemetry-content"],
    },
    "starship-telemetry-content": {
        type: "Column",
        props: { gap: 1, padding: 1 },
        children: ["ship-name-display", "status-display", "power-display"]
    },
    "ship-name-display": {
        type: "Text",
        props: { content: { "$format": "Ship: %s", "$state": "/shipName" } }
    },
    "status-display": {
        type: "Text",
        props: { content: { "$format": "Status: %s", "$state": "/status" } }
    },
    "power-display": {
        type: "Text",
        props: { content: { "$format": "Power: %s%", "$state": "/powerLevel" } }
    },
    "starship-ai-layout-panel": {
      type: "Panel",
      props: { title: "AI-Generated Controls", width: "70%" },
      children: ["starship-ai-layout-slot"],
    },
    "starship-ai-layout-slot": {
      type: "Box",
      props: {
        padding: 1,
        border: "dashed",
        borderColor: "gray",
        minHeight: 10,
      },
      children: ["starship-ai-placeholder"],
    },
    "starship-ai-placeholder": {
      type: "Text",
      props: {
        content: "AI control panel will be generated here. Stand by.",
        align: "center",
        color: "gray",
      },
    },
  },
};

// 4. Streaming Renderer Integration
const streamingRenderer = createStreamingRenderer();

// 5. Main App Logic
async function main() {
  const app = createReziApp({
    initialState: initialSpec.state || {},
    spec: initialSpec,
    actionHandlers: {
      // Dangerous Action Handler
      EJECT_CORE: async (_params, ctx) => {
        ctx.ui.dialog({
          id: "confirm-eject-dialog",
          title: "Confirm Warp Core Ejection",
          children: [
            {
              type: "Text",
              props: {
                content:
                  "This action is irreversible and will result in catastrophic failure. Are you sure?",
                color: "red",
              },
            },
          ],
          buttons: [
            {
              label: "Confirm Ejection",
              action: "CONFIRMED_EJECT",
            },
            { label: "Cancel", action: "dismiss" },
          ],
        });
      },
      CONFIRMED_EJECT: async (_params, ctx) => {
        ctx.store.update({ status: "WARP CORE EJECTED!", powerLevel: 0 });
        ctx.ui.remove("confirm-eject-dialog");
      },
      // AI Generation Handler
      generate: async (_params, ctx) => {
        ctx.store.update({ isStreaming: true, error: null });
        
        streamingRenderer.reset({
          root: "starship-ai-placeholder",
          elements: {
            "starship-ai-placeholder": initialSpec.elements["starship-ai-placeholder"],
          }
        });

        const prompt = `
You are the AI for the USS Rezi's bridge controls. Generate a Rezi spec for a control panel.

**Requirements:**
- The output MUST be a single, valid JSON object for a Rezi spec.
- All element IDs you generate MUST be prefixed with "starship-".
- Include at least one "dangerous" action. For example, a button to "Eject Warp Core".
- The action handler for this dangerous action MUST be "EJECT_CORE".
- The panel should be functional and relevant to starship operations.

**Example of a dangerous action button:**
{
  "type": "Button",
  "props": { "label": "Eject Warp Core", "color": "red" },
  "on": { "press": { "action": "EJECT_CORE" } }
}
`;
        let specString = "";
        try {
          for await (const chunk of getAiStream(prompt, new AbortController().signal)) {
            specString += chunk;
            const { spec: generatedSpec, isValid } = streamingRenderer.push(chunk);

            if (isValid) {
                const mainSpec = app.getSpec();
                if (!mainSpec) continue;

                const newElements = {
                    ...mainSpec.elements,
                    ...generatedSpec.elements,
                };
                
                newElements["starship-ai-layout-panel"] = {
                    ...(newElements["starship-ai-layout-panel"] || { type: 'Panel' }),
                    children: [generatedSpec.root],
                };

                const newState = { ...mainSpec.state, ...generatedSpec.state };

                app.setSpec({
                    ...mainSpec,
                    elements: newElements,
                    state: newState,
                });
            }
          }
        } catch (error: any) {
            ctx.store.update({ error: (error as Error).message });
        } finally {
          ctx.store.update({ isStreaming: false });
        }
      },
    },
  });

  await app.run();

  // Trigger initial generation after a short delay
  setTimeout(() => {
    app.dispatchAction("generate", {});
  }, 500);
}

main().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
