# @cbrunnkvist/json-render-rezitui Examples

Complete list of example applications demonstrating various features.

## ✅ Implemented

| # | Example | Description | Key Features |
|---|---------|-------------|--------------|
| 01 | [hello-world](./01-hello-world) | Minimal static spec | Static rendering, Text, Box |
| 02 | [counter](./02-counter) | Interactive counter | State, actions, bindings, $cond |
| 11 | [ai-chat](./11-ai-chat) | Chat with streaming | SpecStream, VirtualList, async actions |

## 📝 Planned Examples

### Basic (Tier 1)
- [ ] 03-form-validation - Input validation and error display
- [ ] 04-visibility-demo - Conditional visibility with $state

### Data & Visualization (Tier 2)
- [ ] 05-system-dashboard - System metrics dashboard
- [ ] 06-file-browser - File explorer with VirtualList
- [ ] 07-log-viewer - Application logs with filtering
- [ ] 08-data-table - Sortable/filterable table
- [ ] 09-charts-dashboard - LineChart, BarChart, Gauge
- [ ] 10-code-editor - Syntax highlighted editor

### AI-Powered (Tier 2)
- [ ] 12-code-review - Diff viewer for code reviews
- [ ] 13-task-planner - AI-assisted task breakdown
- [ ] 14-error-explainer - Error log interpreter

### Terminal-Specific (Tier 2)
- [ ] 15-command-palette-demo - Quick actions palette
- [ ] 16-terminal-dashboard - Multi-panel layout
- [ ] 17-confirm-modal - Confirmation dialogs
- [ ] 18-toast-notifications - Toast messages

### Advanced (Tier 3)
- [ ] 19-multi-page-app - Router integration
- [ ] 20-real-time-collab - WebSocket collaboration
- [ ] 21-database-browser - SQL query UI
- [ ] 22-git-ui - Git interface
- [ ] 23-http-client - REST API client
- [ ] 24-process-manager - Process monitor

### Integration (Tier 3)
- [ ] 25-express-server-ui - Server dashboard
- [ ] 26-vite-plugin-demo - Build tool UI
- [ ] 27-testing-dashboard - Test runner UI

---

## Running Examples

```bash
# Navigate to any example
cd examples/01-hello-world

# Install dependencies
npm install

# Run the example
npm start
```

## Creating New Examples

Use this template:

```bash
mkdir examples/XX-example-name
cd examples/XX-example-name

# Create package.json
cat > package.json << 'EOF'
{
  "name": "@cbrunnkvist/json-render-rezitui-example-example-name",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "tsx src/index.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@cbrunnkvist/json-render-rezitui": "workspace:*",
    "@rezi-ui/node": "workspace:*"
  },
  "devDependencies": {
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
EOF

# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
EOF

# Create main file
mkdir -p src
cat > src/index.ts << 'EOF'
import { createReziApp } from "json-render-rezitui";

const spec = {
  catalog: "core",
  elements: [
    // Your elements here
  ]
};

async function main() {
  const app = createReziApp({ spec });
  await app.run();
}

main().catch(console.error);
EOF

# Create README
cat > README.md << 'EOF'
# Example Name

Description of what this example demonstrates.

## Running

\`\`\`bash
npm install
npm start
\`\`\`
EOF
```

## Example Checklist

Before submitting a new example:

- [ ] `package.json` with correct dependencies
- [ ] `tsconfig.json` extending root config
- [ ] `src/index.ts` with working code
- [ ] `README.md` with description and instructions
- [ ] Tested and working
- [ ] Added to this index
- [ ] Screenshots (optional but recommended)

## Feature Coverage Matrix

| Feature | 01 | 02 | 11 | Planned |
|---------|----|----|----|---------|
| Static spec | ✅ | ✅ | ✅ | All |
| State management | - | ✅ | ✅ | All interactive |
| Actions | - | ✅ | ✅ | All interactive |
| Event bindings | - | ✅ | ✅ | All interactive |
| $state | - | ✅ | ✅ | Most |
| $cond | - | ✅ | - | Visibility demo |
| $template | - | ✅ | - | Counter, forms |
| Bindings | - | ✅ | - | Forms |
| VirtualList | - | - | ✅ | 06, 07, 08 |
| SpecStream | - | - | ✅ | 11-14 |
| Table | - | - | - | 07, 08 |
| CodeEditor | - | - | - | 10, 12, 14 |
| Charts | - | - | - | 09 |
| Modal | - | - | - | 17 |
| CommandPalette | - | - | - | 15 |
| Custom actions | - | - | ✅ | 11-14, 20 |
| Router | - | - | - | 19 |

---

## Contributing

Want to add an example? Pick one from the planned list and implement it following the template above!
