# System Dashboard Example

Real-time system monitoring dashboard with CPU, memory, and process metrics.

## What It Demonstrates

- ✅ Real-time data updates
- ✅ Gauge visualization with progress bars
- ✅ Table component for process listing
- ✅ Conditional coloring (green/yellow/red)
- ✅ Template expressions for formatting
- ✅ Platform integration (os module)

## Running

```bash
npm install
npm start
```

## Features

### Live Metrics
- **CPU Usage**: Real-time percentage with color-coded alerts
- **Memory**: Used/total with visual progress bar
- **Uptime**: System uptime display
- **Process Table**: Top 10 processes sorted by CPU

### Visual Indicators
```
CPU < 50%:    🟢 Green
CPU 50-80%:   🟡 Yellow
CPU > 80%:    🔴 Red

Memory < 60%: 🟢 Green
Memory 60-80%: 🟡 Yellow
Memory > 80%: 🔴 Red
```

### Progress Bars
```
CPU:  [######----------------] 30%
Mem:  [##############--------] 65%
```

## Key Concepts

### 1. Real-time Updates
```typescript
setInterval(() => {
  const stats = getSystemStats();
  app.renderer.setState("/cpu", stats.cpu);
  app.renderer.setState("/memory", stats.memory);
}, 1000);
```

### 2. Conditional Styling
```typescript
{
  color: {
    $cond: {
      $state: "/cpu",
      gt: 80,
      then: "red",
      else: {
        $cond: {
          $state: "/cpu",
          gt: 50,
          then: "yellow",
          else: "green"
        }
      }
    }
  }
}
```

### 3. Template Expressions
```typescript
{
  content: {
    $template: "[${'#'.repeat(Math.round(cpu/5))}${'-'.repeat(20-Math.round(cpu/5))}]"
  }
}
```

### 4. Table Component
```typescript
{
  type: "Table",
  props: {
    columns: [
      { key: "pid", header: "PID", width: 8 },
      { key: "cpu", header: "CPU%", width: 8 },
      { key: "command", header: "Command", width: 30 }
    ],
    rows: { $state: "/processes" }
  }
}
```

## Output

```
╔════════════════════════════════════════╗
║         🖥️  System Dashboard           ║
║    Platform: darwin | Uptime: 48h 32m  ║
╚════════════════════════════════════════╝

┌──────────────────┐  ┌──────────────────┐
│ CPU Usage        │  │ Memory           │
│ 30%              │  │ 8GB / 16GB       │
│ [######----------]│  │ [##########------]│
└──────────────────┘  └──────────────────┘

🔝 Top Processes
──────────────────────────────────────────
PID     CPU%    MEM%    Command
1234    5.2     2.1     node
5678    3.1     1.5     chrome
9012    2.8     1.2     vscode
──────────────────────────────────────────

⏱️  Refreshing every 1000ms | Press Ctrl+C to exit
```

## Extending

### Add Disk Usage
```typescript
function getDiskStats() {
  const output = execSync("df -h /", { encoding: "utf-8" });
  // Parse and return disk usage
}
```

### Add Network Stats
```typescript
function getNetworkStats() {
  const output = execSync("netstat -i", { encoding: "utf-8" });
  // Parse network interfaces
}
```

### Export to File
```typescript
// Add export action
{
  key: "export-btn",
  type: "Button",
  props: { label: "📊 Export" },
  on: {
    press: {
      action: "exportStats"
    }
  }
}

// Custom action
customActions: {
  exportStats: async (_params, ctx) => {
    const stats = ctx.store.getState();
    await fs.writeFile("stats.json", JSON.stringify(stats, null, 2));
    ctx.addToast?.({ message: "Stats exported!", intent: "success" });
  }
}
```
