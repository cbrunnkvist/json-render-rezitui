import * as dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../../.env") });
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

// 2. Streaming Client (reused)
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

// 3. Mock Data
const incidents = [
  { id: "INC001", service: "Auth Service", status: "Investigating", severity: "Critical", summary: "Login failures for all users" },
  { id: "INC002", service: "Payment Gateway", status: "Identified", severity: "High", summary: "Credit card processing timeouts" },
  { id: "INC003", service: "API Gateway", status: "Monitoring", severity: "Medium", summary: "Elevated p99 latency" },
  { id: "INC004", service: "Database Cluster", status: "Resolved", severity: "Low", summary: "High replication lag on read replica" },
];

// 4. Host UI Shell
const initialSpec: Spec = {
  root: "incident-main",
  state: {
    incidents,
    selectedIncidentId: "INC001",
    isStreaming: false,
    error: null,
  },
  elements: {
    "incident-main": {
      type: "Column",
      props: { padding: 1, border: "double", borderColor: "yellow" },
      children: ["incident-header", "incident-body"],
    },
    "incident-header": {
      type: "Text",
      props: {
        content: "🚨 Incident Arcade",
        bold: true,
        color: "yellow",
        align: "center",
      },
    },
    "incident-body": {
      type: "Row",
      props: { gap: 1, height: "100%" },
      children: ["incident-list-panel", "incident-details-panel", "incident-ai-panel"],
    },
    "incident-list-panel": {
      type: "Box",
      props: { width: 30 },
      children: ["incident-list-inner-panel"],
    },
    "incident-list-inner-panel": {
      type: "Panel",
      props: { title: "Active Incidents" },
      children: ["incident-list"],
    },
    "incident-list": {
      type: "Column",
      props: { overflow: "scroll", height: "100%" },
      children: ["incident-list-item"]
    },
    "incident-list-item": {
      type: "Box",
      repeat: "/incidents",
      props: {
        p: 1,
        border: "bottom",
        style: {
          borderStyle: { color: "gray" },
          bg: {
            $cond: { "$state": "/selectedIncidentId", "eq": { "$item": "id" } },
            $then: "blue",
            $else: "none"
          },
          fg: {
            $cond: { "$state": "/selectedIncidentId", "eq": { "$item": "id" } },
            $then: "white",
            $else: "white"
          }
        }
      },
      on: {
        click: {
          action: "setState",
          payload: { path: "/selectedIncidentId", value: { "$item": "id" } }
        }
      },
      children: ["incident-list-item-content"]
    },
    "incident-list-item-content": {
      type: "Text",
      props: { content: { "$format": "[%s] %s", "args": [{ "$item": "id" }, { "$item": "service" }] } }
    },
    // Incident Details Panel (Host-Controlled)
    "incident-details-panel": {
      type: "Box",
      props: { width: 35 },
      children: ["incident-details-inner-panel"]
    },
    "incident-details-inner-panel": {
      type: "Panel",
      props: { title: "Incident Details" },
      children: ["incident-details-content"]
    },
    "incident-details-content": {
      type: "Column",
      props: {
        padding: 1,
        gap: 1,
        "$if": {
          "cond": { "$state": "/selectedIncidentId" },
          "then": {},
          "else": { "hidden": true }
        }
      },
      children: ["detail-id", "detail-service", "detail-status", "detail-severity", "detail-summary"]
    },
    "detail-id": { type: "Text", props: { content: { "$format": "ID: %s", "$state": "/incidents[id={ $state: /selectedIncidentId }].id" } } },
    "detail-service": { type: "Text", props: { content: { "$format": "Service: %s", "$state": "/incidents[id={ $state: /selectedIncidentId }].service" } } },
    "detail-status": { type: "Text", props: { content: { "$format": "Status: %s", "$state": "/incidents[id={ $state: /selectedIncidentId }].status" } } },
    "detail-severity": { type: "Text", props: { content: { "$format": "Severity: %s", "$state": "/incidents[id={ $state: /selectedIncidentId }].severity" } } },
    "detail-summary": { type: "Text", props: { content: { "$format": "Summary: %s", "$state": "/incidents[id={ $state: /selectedIncidentId }].summary" }, "wrap": "word" } },
    "incident-ai-panel": {
      type: "Box",
      props: { width: 35 },
      children: ["incident-ai-inner-panel"],
    },
    "incident-ai-inner-panel": {
      type: "Panel",
      props: { title: "AI Assistant" },
      children: ["incident-ai-slot"],
    },
    "incident-ai-slot": {
      type: "Box",
      props: {
        padding: 1,
        border: "dashed",
        borderColor: "gray",
        minHeight: 10,
      },
      children: ["incident-ai-placeholder"],
    },
    "incident-ai-placeholder": {
      type: "Text",
      props: {
        content: "Select an incident to get AI assistance.",
        align: "center",
        color: "gray",
      },
    },
  },
};

// 5. Streaming Renderer Integration
const streamingRenderer = createStreamingRenderer();

// 6. Main App Logic
async function main() {
  const app = createReziApp({
    initialState: initialSpec.state || {},
    spec: initialSpec,
    debug: true,
    actionHandlers: {
      // Dangerous Action Handlers
      RESTART_SERVICE: async (params, ctx) => {
        ctx.ui.dialog({
          id: "confirm-restart-dialog",
          title: "Confirm Service Restart",
          children: [{ type: "Text", props: { content: `Are you sure you want to restart the ${params.service}?` } }],
          buttons: [{ label: "Confirm", action: "CONFIRMED_ACTION", payload: { message: `Service ${params.service} restarted.` } }, { label: "Cancel", action: "dismiss" }],
        });
      },
      PURGE_QUEUE: async (params, ctx) => {
        ctx.ui.dialog({
          id: "confirm-purge-dialog",
          title: "Confirm Queue Purge",
          children: [{ type: "Text", props: { content: `This is a destructive action. Are you sure you want to purge the ${params.queue} queue?`, color: "red" } }],
          buttons: [{ label: "Confirm Purge", action: "CONFIRMED_ACTION", payload: { message: `Queue ${params.queue} purged.` } }, { label: "Cancel", action: "dismiss" }],
        });
      },
      CONFIRMED_ACTION: async (params, ctx) => {
        const incidentId = ctx.store.getSnapshot().selectedIncidentId;
        // In a real app, you'd perform the action here.
        // For the demo, we'll just update the incident status.
        ctx.store.update(`incidents[id=${incidentId}].status`, "Action Taken");
        ctx.store.update(`incidents[id=${incidentId}].summary`, `${ctx.store.getSnapshot().incidents.find((i: any) => i.id === incidentId).summary}. Last action: ${params.message}`);
        ctx.ui.remove("confirm-restart-dialog");
        ctx.ui.remove("confirm-purge-dialog");
      },
      // AI Generation Handler
      generate: async (_params, ctx) => {
        const state = ctx.store.getSnapshot() as any;
        const incident = state.incidents.find(i => i.id === state.selectedIncidentId);
        if (!incident) return;

        ctx.store.update({ isStreaming: true, error: null });
        streamingRenderer.reset({ root: "incident-ai-placeholder", elements: { "incident-ai-placeholder": { type: "Text", props: { content: "AI is thinking..." } } } });

        const prompt = `
You are an AI assistant for a Site Reliability Engineer (SRE).
An incident has occurred. Based on the incident details, provide a Rezi spec for an "AI Assistant" panel.

**Incident Details:**
- Service: ${incident.service}
- Severity: ${incident.severity}
- Summary: ${incident.summary}

**Requirements:**
- The output MUST be a single, valid JSON object for a Rezi spec.
- All element IDs you generate MUST be prefixed with "incident-".
- Provide a brief summary of the likely issue.
- Suggest a list of "Next Actions" or a "Runbook".
- Include buttons for potential remediation actions. At least one should be a "dangerous" action.
- Dangerous actions: "Restart Service" (action: "RESTART_SERVICE"), "Purge Queue" (action: "PURGE_QUEUE").
- Pass necessary context in the action payload, e.g., { "service": "${incident.service}" }.

**Example Dangerous Action Button:**
{
  "type": "Button",
  "props": { "label": "Restart Auth Service", "color": "red" },
  "on": { "press": { "action": "RESTART_SERVICE", "payload": { "service": "Auth Service" } } }
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

              const newElements = { ...mainSpec.elements, ...generatedSpec.elements };
              newElements["incident-ai-panel"] = {
                ...(newElements["incident-ai-panel"] || { type: 'Panel' }),
                children: [generatedSpec.root],
              };
              const newState = { ...mainSpec.state, ...generatedSpec.state };

              app.setSpec({ ...mainSpec, elements: newElements, state: newState });
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

  // Trigger AI generation when the selected incident changes
  app.renderer.store.subscribe(
    (state) => state.selectedIncidentId,
    () => {
      app.dispatchAction("generate", {});
    }
  );

  await app.run();

  // Trigger initial generation
  app.dispatchAction("generate", {});
}

main().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
