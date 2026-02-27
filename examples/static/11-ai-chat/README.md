# AI Chat Example

Real-time chat interface demonstrating SpecStream progressive rendering.

## What It Demonstrates

- ✅ SpecStream integration for streaming content
- ✅ Progressive UI updates
- ✅ VirtualList for message history
- ✅ Custom action handlers
- ✅ Loading states
- ✅ Async actions

## Running

```bash
pnpm install
pnpm start
```

## How It Works

### 1. User Sends Message
```typescript
{
  on: {
    press: {
      action: "sendMessage"  // Custom async action
    }
  }
}
```

### 2. Custom Action Handler
```typescript
customActions: {
  sendMessage: async (_params, ctx) => {
    // Add user message to state
    messages.push({ role: "user", content: input });
    
    // Stream AI response
    for await (const chunk of simulateAIResponse(input)) {
      messages[assistantIndex].content += chunk;
      ctx.store.update({ messages });  // Triggers re-render
    }
  }
}
```

### 3. Progressive Updates
Each `ctx.store.update()` triggers a re-render, showing the AI response as it streams in character by character.

## Key Features

- **VirtualList**: Efficiently renders large message histories
- **Streaming**: AI response appears progressively (like ChatGPT)
- **State Management**: Messages stored in StateStore
- **Loading State**: Send button shows "Thinking..." during streaming

## Output

```
┌──────────────────────────────────┐
│     🤖 AI Chat Assistant         │
└──────────────────────────────────┘

Welcome! I'm an AI assistant...
──────────────────────────────────
> What is TypeScript?

That's an interesting question...
Let me think about this...

Based on my analysis, here's...
[text appears progressively]

[Type your message...] [📤 Send]
```

## Extending This Example

### Connect to Real AI
Replace `simulateAIResponse()` with actual API call:

```typescript
async function* streamFromOpenAI(message: string) {
  const response = await fetch('https://api.openai.com/...', {
    method: 'POST',
    body: JSON.stringify({ message })
  });
  
  const reader = response.body?.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decode(value);
  }
}
```

### Add Message Persistence
```typescript
customActions: {
  sendMessage: async (_params, ctx) => {
    // Save to file/database
    await saveMessage({ role: "user", content: input });
    // ... rest of handler
  }
}
```
