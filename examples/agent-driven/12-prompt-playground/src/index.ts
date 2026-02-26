import "dotenv/config";
import { createReziApp, createStreamingRenderer } from "json-render-rezitui";
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

// 2. Streaming Client
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
  root: "playground-main",
  state: {
    prompt:
      "A Rezi spec for a simple counter. It should have a text display for the count and a button to increment it. The initial count should be 0.",
    rawSpec: "{}",
    isStreaming: false,
    error: null,
  },
  elements: {
    "playground-main": {
      type: "Column",
      props: { gap: 1, padding: 1, border: "single" },
      children: [
        "playground-header",
        "playground-prompt-area",
        "playground-controls",
        "playground-output-container",
      ],
    },
    "playground-header": {
      type: "Text",
      props: {
        content: "🤖 Agent-Driven Prompt Playground",
        bold: true,
        color: "cyan",
        align: "center",
      },
    },
    "playground-prompt-area": {
      type: "Panel",
      props: { title: "Prompt" },
      children: [
        "playground-prompt-input",
      ],
    },
    "playground-prompt-input": {
        type: "Input",
        props: {
          id: "playground-prompt-input",
          placeholder: "Enter your prompt here...",
          value: { $state: "/prompt" },
          bindings: { value: "/prompt" },
        },
    },
    "playground-controls": {
      type: "Row",
      props: { gap: 2, paddingX: 1 },
      children: [
        "playground-generate-btn",
        "playground-regenerate-btn",
        "playground-cancel-btn",
      ],
    },
    "playground-generate-btn": {
      type: "Button",
      props: {
        id: "playground-generate-btn",
        label: "✨ Generate",
        disabled: { $state: "/isStreaming" },
      },
      on: { press: { action: "generate" } },
    },
    "playground-regenerate-btn": {
      type: "Button",
      props: {
        id: "playground-regenerate-btn",
        label: "🔄 Regenerate",
        disabled: { $state: "/isStreaming" },
      },
      on: { press: { action: "generate" } },
    },
    "playground-cancel-btn": {
      type: "Button",
      props: {
        id: "playground-cancel-btn",
        label: "❌ Cancel",
        disabled: { $not: { $state: "/isStreaming" } },
      },
      on: { press: { action: "cancel" } },
    },
    "playground-output-container": {
      type: "Row",
      props: { gap: 1 },
      children: ["playground-output-panel", "playground-inspector-panel"],
    },
    "playground-output-panel": {
      type: "Panel",
      props: { title: "Rendered Output", width: "50%" },
      children: ["playground-output-slot"],
    },
    "playground-output-slot": {
      type: "Box",
      props: {
        padding: 1,
        border: "single",
        borderColor: "gray",
        minHeight: 5,
      },
      children: ["playground-output-placeholder"],
    },
    "playground-output-placeholder": {
      type: "Text",
      props: { content: "AI output will be rendered here." },
    },
    "playground-inspector-panel": {
      type: "Panel",
      props: { title: "Spec Inspector", width: "50%" },
      children: ["playground-spec-display"],
    },
    "playground-spec-display": {
      type: "Text",
      props: {
        content: { $state: "/rawSpec" },
        wrap: "word",
      },
    },
  },
};

// 4. Streaming Renderer Integration
const streamingRenderer = createStreamingRenderer();

// 5. Main App Logic
async function main() {
  let abortController = new AbortController();

  const app = createReziApp({
    initialState: initialSpec.state || {},
    spec: initialSpec,
    actionHandlers: {
      generate: async (_params, ctx) => {
        const prompt = ctx.store.getState().prompt as string;
        if (!prompt.trim()) return;

        abortController = new AbortController();
        ctx.store.update({ isStreaming: true, error: null, rawSpec: "" });
        
        // Reset the streaming renderer for the new response
        streamingRenderer.reset({
          root: "playground-output-placeholder",
          elements: {
            "playground-output-placeholder": {
              type: "Text",
              props: { content: "AI output will be rendered here." },
            },
          }
        });

        const finalPrompt = `
You are an expert in the Rezi TUI framework. Your task is to generate a JSON specification for a terminal UI based on a user's prompt.

**Constraints:**
- The output MUST be a single, valid JSON object representing a Rezi spec.
- The spec MUST have a 'root' property pointing to the key of the main element.
- The spec MUST have an 'elements' property which is an object mapping keys to element definitions.
- Do NOT include any markdown, explanations, or any text outside of the JSON object.

**User Prompt:**
"${prompt}"

**Example Output:**
{
  "root": "my-counter",
  "state": { "count": 0 },
  "elements": {
    "my-counter": {
      "type": "Column",
      "props": { "gap": 1 },
      "children": ["count-display", "increment-btn"]
    },
    "count-display": {
      "type": "Text",
      "props": { "content": { "$format": "Count: %s", "$state": "/count" } }
    },
    "increment-btn": {
      "type": "Button",
      "props": { "label": "Increment" },
      "on": { "press": { "action": "updateState", "payload": { "path": "/count", "value": { "$add": [{ "$state": "/count" }, 1] } } } }
    }
  }
}
`;
        let specString = "";
        try {
          for await (const chunk of getAiStream(
            finalPrompt,
            abortController.signal,
          )) {
            specString += chunk;
            ctx.store.update({ rawSpec: specString });

            // Push the chunk to the streaming renderer
            const { spec: generatedSpec, isValid } = streamingRenderer.push(chunk);

            if (isValid) {
                const mainSpec = app.getSpec();
                if (!mainSpec) continue;

                const newElements = {
                    ...mainSpec.elements,
                    ...generatedSpec.elements,
                };
                
                newElements["playground-output-panel"] = {
                    ...(newElements["playground-output-panel"] || { type: 'Panel' }),
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
          if (error.name !== "AbortError") {
            const err = error as Error;
            ctx.store.update({ error: err.message });
          }
        } finally {
          ctx.store.update({ isStreaming: false });
        }
      },
      cancel: async () => {
        abortController.abort();
      },
    },
  });

  await app.run();
}

main().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
