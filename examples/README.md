# @cbrunnkvist/json-render-rezitui Examples

Example apps demonstrating various features of `@cbrunnkvist/json-render-rezitui`.

## Categories

### Static Examples (`examples/static/`)
Static JSON specs that render once. Good for learning basics.
- **01-hello-world**: Minimal text rendering
- **02-counter**: Interactive state management

### Agent-Driven Examples (`examples/agent-driven/`)
AI-powered apps using streaming SpecRender for dynamic UI.

**Environment Setup** - All need API credentials:
```bash
# In each example folder, create .env:
OPENCODE_API_KEY="your-key"
OPENCODE_MODEL="model-name"
```
Get credentials from [opencode.com](https://opencode.com).

- **12-prompt-playground**: Experiment with AI-generated specs
- **13-starship-bridge**: Ship simulator with AI co-pilot
- **14-incident-arcade**: Incident management with AI advisor

### Data & Visualization
Real-time dashboards with metrics and charts.
- **05-system-dashboard**: System resource monitor

## Running

```bash
cd examples/[category]/[name]
npm install
npm start
```

Each example folder has a small README explaining its use case and how to operate it.
