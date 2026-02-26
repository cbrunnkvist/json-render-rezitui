/**
 * AI Chat Example
 * 
 * Demonstrates SpecStream integration for progressive rendering
 * of AI-generated responses. Shows real-time UI updates as AI
 * streams content.
 */

import { createReziApp, createStreamingRenderer } from "json-render-rezitui";
import type { Spec } from "@json-render/core";

// Initial chat UI spec
const initialSpec: Spec = {
  catalog: "core",
  state: {
    messages: [
      { role: "system", content: "Welcome! I'm an AI assistant. Type a message to begin." }
    ],
    inputValue: "",
    isStreaming: false
  },
  elements: [
    {
      key: "header",
      type: "Box",
      props: {
        padding: 1,
        border: "single"
      },
      children: [
        {
          key: "title",
          type: "Text",
          props: {
            content: "🤖 AI Chat Assistant",
            bold: true,
            color: "cyan",
            align: "center"
          }
        }
      ]
    },
    {
      key: "messages",
      type: "VirtualList",
      props: {
        id: "messages-list",
        items: { $state: "/messages" },
        renderItem: { $item: "content" },
        maxHeight: 15
      }
    },
    {
      key: "input-section",
      type: "Row",
      props: {
        gap: 1,
        padding: 1,
        border: "top"
      },
      children: [
        {
          key: "input",
          type: "Input",
          props: {
            id: "chat-input",
            placeholder: "Type your message...",
            value: { $state: "/inputValue" },
            bindings: {
              value: "/inputValue"
            },
            disabled: { $state: "/isStreaming" }
          }
        },
        {
          key: "send-btn",
          type: "Button",
          props: {
            id: "send-btn",
            label: { $cond: { $state: "/isStreaming", then: "⏳ Thinking...", else: "📤 Send" } },
            disabled: { $state: "/isStreaming" }
          },
          on: {
            press: {
              action: "sendMessage"
            }
          }
        }
      ]
    }
  ]
};

// Simulated AI response generator
async function* simulateAIResponse(userMessage: string): AsyncGenerator<string> {
  const responses = [
    `That's an interesting question about "${userMessage}".`,
    " Let me think about this...",
    "\n\nBased on my analysis,",
    " here's what I found:",
    "\n\n1. First point about your query",
    "\n2. Second consideration",
    "\n3. Final recommendation",
    "\n\nDoes this help answer your question?"
  ];

  for (const chunk of responses) {
    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 400));
    yield chunk;
  }
}

async function main() {
  console.log("Starting AI Chat example...\n");
  console.log("This demonstrates SpecStream progressive rendering.\n");

  const app = createReziApp({
    spec: initialSpec,
    customActions: {
      sendMessage: async (_params, ctx) => {
        const input = ctx.store.getState().inputValue as string;
        if (!input.trim()) return;

        // Add user message
        const messages = ctx.store.getState().messages as Array<{ role: string; content: string }>;
        messages.push({ role: "user", content: input });
        
        // Clear input and set streaming state
        ctx.store.update({
          messages,
          inputValue: "",
          isStreaming: true
        });

        // Create streaming renderer for AI response
        const streamingRenderer = createStreamingRenderer({
          onSpecUpdate: (spec) => {
            app.renderer.setSpec(spec);
          },
          onError: (error) => {
            console.error("Streaming error:", error);
          }
        });

        // Add placeholder for AI response
        messages.push({ role: "assistant", content: "" });
        const assistantIndex = messages.length - 1;

        // Stream AI response
        try {
          for await (const chunk of simulateAIResponse(input)) {
            messages[assistantIndex].content += chunk;
            ctx.store.update({ messages });
          }
        } finally {
          ctx.store.update({ isStreaming: false });
        }
      }
    }
  });

  await app.run();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
