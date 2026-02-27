# Counter Example

Interactive counter demonstrating state management and actions.

## What It Demonstrates

- ✅ State management (`state: { count: 0, step: 1 }`)
- ✅ Action handlers (`setState`)
- ✅ Event bindings (`on.press`)
- ✅ Two-way data binding (`bindings`)
- ✅ Conditional styling (`$cond`)
- ✅ Template expressions (`$template`)

## Running

```bash
pnpm install
pnpm start
```

## Key Concepts

### 1. State Declaration
```typescript
state: {
  count: 0,
  step: 1
}
```

### 2. State Binding
```typescript
{
  props: {
    content: { $state: "/count" }  // Reads from state
  }
}
```

### 3. Action on Event
```typescript
{
  on: {
    press: {
      action: "setState",
      params: {
        path: "/count",
        value: { $template: "${count + step}" }
      }
    }
  }
}
```

### 4. Two-Way Binding
```typescript
{
  props: {
    value: { $state: "/step" },
    bindings: {
      value: "/step"  // Updates state when input changes
    }
  }
}
```

### 5. Conditional Styling
```typescript
{
  color: { 
    $cond: { 
      $state: "/count", 
      gt: 0, 
      then: "green", 
      else: { 
        $cond: { 
          $state: "/count", 
          lt: 0, 
          then: "red", 
          else: "white" 
        } 
      } 
    } 
  }
}
```

## Output

```
╔════════════════════════════════╗
║     🧮 Interactive Counter     ║
╚════════════════════════════════╝

        42
     Current Count

[➖ Decrement] [🔄 Reset] [➕ Increment]

Step size: [1        ]

💡 Try changing the step size and clicking the buttons!
```

## Interactive Features

- **Increment/Decrement**: Changes count by step size
- **Reset**: Returns count to 0
- **Step Input**: Change the increment/decrement amount
- **Color Coding**: Positive = green, Negative = red, Zero = white
