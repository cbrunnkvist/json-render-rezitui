/**
 * AI Chat Example
 * 
 * Demonstrates SpecStream integration for progressive rendering
 * of AI-generated responses. Shows real-time UI updates as AI
 * streams content.
 * 
 * Uses message windowing and a flat single-Text-per-message layout
 * to work around Rezi's Column layout constraints.
 */

import { createReziApp, createStreamingRenderer } from "@cbrunnkvist/json-render-rezitui";
import type { Spec } from "@json-render/core";

/** Maximum number of messages to display at once */
const MAX_VISIBLE_MESSAGES = 5;

// Initial chat UI spec
const initialSpec: Spec = {
  root: "main",
  elements: {
    main: {
      type: "Column",
      props: {},
      children: ["header", "messages", "input-section"]
    },
    header: {
      type: "Box",
      props: {
        padding: 1,
        border: "single"
      },
      children: ["title"]
    },
    title: {
      type: "Text",
      props: {
        content: "🤖 AI Chat Assistant",
        bold: true,
        color: "cyan",
        align: "center"
      }
    },
    messages: {
      type: "Column",
      props: {
        id: "messages-list",
        flex: 1,
        gap: 0
      },
      children: ["message-item"]
    },
    // Each message is a single wrapped Text node to minimize layout children.
    // The role label is prepended inline to avoid nested Column overhead.
    "message-item": {
      type: "Text",
      repeat: "/visibleMessages",
      props: {
        content: { $item: "display" },
        wrap: true
      }
    },
    "input-section": {
      type: "Row",
      props: {
        gap: 1,
        padding: 1,
        border: "single",
        borderTop: true,
        borderBottom: false,
        borderLeft: false,
        borderRight: false
      },
      children: ["input", "send-btn"]
    },
    input: {
      type: "Input",
      props: {
        id: "chat-input",
        placeholder: "Type your message...",
        value: { $bindState: "/inputValue" },
        disabled: { $state: "/isStreaming" }
      }
    },
    "send-btn": {
      type: "Button",
      props: {
        id: "send-btn",
        label: { $cond: { $state: "/isStreaming" }, $then: "⏳ Thinking...", $else: "📤 Send" },
        disabled: { $state: "/isStreaming" }
      },
      on: {
        press: {
          action: "sendMessage"
        }
      }
    }
  },
  state: {
    messages: [] as Array<{ role: string; content: string }>,
    visibleMessages: [] as Array<{ display: string }>,
    inputValue: "",
    isStreaming: false
  }
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

/** Format a message for display with role prefix */
function formatMessage(msg: { role: string; content: string }): string {
  const roleEmoji = msg.role === "user" ? "👤" : msg.role === "assistant" ? "🤖" : "ℹ️";
  return `${roleEmoji} ${msg.role}: ${msg.content}`;
}

/**
 * Build the visibleMessages array from the messages tail.
 * Each entry has a single `display` string that includes
 * the role label, avoiding nested layout overhead.
 */
function buildVisibleMessages(messages: Array<{ role: string; content: string }>): Array<{ display: string }> {
  const tail = messages.length <= MAX_VISIBLE_MESSAGES
    ? messages
    : messages.slice(-MAX_VISIBLE_MESSAGES);
  return tail.map(msg => ({ display: formatMessage(msg) }));
}

async function main() {
  const initialMessages = [
    { role: "system", content: "Welcome! I'm an AI assistant. Type a message to begin." }
  ];

  const app = createReziApp({
    spec: initialSpec,
    initialState: {
      messages: initialMessages,
      visibleMessages: buildVisibleMessages(initialMessages),
      inputValue: "",
      isStreaming: false
    },
    actionHandlers: {
      sendMessage: async (_params, ctx) => {
        const state = ctx.store.getSnapshot() as any;
        const input = state.inputValue as string;
        if (!input.trim()) return;

        // Add user message
        const messages = [...(state.messages as Array<{ role: string; content: string }>)];
        messages.push({ role: "user", content: input });

        // Clear input and set streaming state
        ctx.store.update({
          messages,
          visibleMessages: buildVisibleMessages(messages),
          inputValue: "",
          isStreaming: true
        });

        // Add placeholder for AI response
        const assistantIndex = messages.length;
        messages.push({ role: "assistant", content: "..." });
        ctx.store.update({
          messages,
          visibleMessages: buildVisibleMessages(messages)
        });

        // Stream AI response
        try {
          for await (const chunk of simulateAIResponse(input)) {
            const currentMessages = [...(ctx.store.getSnapshot().messages as any)];
            if (currentMessages[assistantIndex]) {
              if (currentMessages[assistantIndex].content === "...") {
                currentMessages[assistantIndex] = { ...currentMessages[assistantIndex], content: chunk };
              } else {
                currentMessages[assistantIndex] = {
                  ...currentMessages[assistantIndex],
                  content: currentMessages[assistantIndex].content + chunk
                };
              }
              ctx.store.update({
                messages: currentMessages,
                visibleMessages: buildVisibleMessages(currentMessages)
              });
            }
          }
        } finally {
          ctx.store.update({ isStreaming: false });
        }
      }
    },
    debug: true
  });

  await app.run();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
