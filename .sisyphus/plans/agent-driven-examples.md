# Agent-Driven Examples Plan

## Introduction
This plan details the implementation of three agent-driven examples for `@json-render/rezi` in the `examples/agent-driven/` directory. These examples will demonstrate real-world AI connectivity using OpenCode models, showcasing how to render AI-generated UI safely using slot rendering and confirmation dialogs.

## Constraints & Requirements
- **Online-Only**: NO offline fallback mode. If env vars are missing, the app must fail fast with a helpful message.
- **Environment**: Require `OPENCODE_API_KEY` and `OPENCODE_MODEL` in a repo-root `.env` file.
- **Client**: Each example must include a minimal streaming client that tries `/responses` and falls back to `/chat/completions`.
- **Slot Rendering**: The host UI provides the shell/layout. The AI model only generates a subtree for a specific slot.
- **Safety**: Generated IDs must be prefixed (e.g., `starship-btn-1`).
- **Dangerous Actions**: `13-starship-bridge` and `14-incident-arcade` MUST use a `ConfirmActionDialog` for dangerous actions.
- **Robustness**: Do not crash on malformed model output. Show errors in an inspector panel and keep the last valid subtree.

---

## Task 1: Foundation & Prompt Playground [x]

**Goal**: Create the `12-prompt-playground` example to establish the streaming client, env validation, and slot rendering pattern.

**Steps**:
1. Create `examples/agent-driven/12-prompt-playground/` package structure.
2. Implement env validation utility (fail fast if `OPENCODE_API_KEY` or `OPENCODE_MODEL` is missing).
3. Implement the minimal streaming client:
   - Try `POST /responses` (streaming).
   - Fallback to `POST /chat/completions` (streaming).
   - Handle SSE token streaming and error reporting.
4. Implement the host UI shell using Rezi primitives (`ui.page`, `ui.panel`, etc.).
   - Include a prompt input area.
   - Include a "Spec Inspector" panel to show raw JSON and parse/validation errors.
   - Include buttons to generate, regenerate, and cancel.
5. Integrate `createStreamingRenderer` to render the AI-generated subtree into the designated slot.
6. Write the example-specific README (Prereqs, Run, What to try, Troubleshooting).

**Verification**:
- Verify app fails fast with clear message when env vars are missing.
- Verify streaming works and updates the UI progressively.
- Verify the Spec Inspector shows raw JSON and any errors.
- Verify invalid JSON does not crash the app (last valid state is kept).

---

## Task 2: Starship Bridge Example [x]

**Goal**: Create the `13-starship-bridge` example focusing on layout generation, telemetry, and dangerous action confirmation.

**Steps**:
1. Create `examples/agent-driven/13-starship-bridge/` package structure.
2. Reuse the env validation and streaming client from Task 1.
3. Implement the host UI shell for the Starship Bridge.
   - Include a telemetry/status panel (host-controlled).
   - Define a slot for the AI-generated layout/panels.
4. Implement `ConfirmActionDialog` using Rezi's `ui.dialog` or `ui.modal`.
5. Integrate the streaming renderer. Ensure the AI prompt instructs it to prefix all generated IDs with `starship-`.
6. Implement a dangerous action handler (e.g., "Eject Core") that triggers the `ConfirmActionDialog` before executing.
7. Write the example-specific README.

**Verification**:
- Verify fail-fast on missing env vars.
- Verify AI generates UI within its slot.
- Verify generated IDs are prefixed.
- Verify clicking a dangerous action button opens the confirmation dialog and requires user approval.

---

## Task 3: Incident Arcade Example [x]

**Goal**: Create the `14-incident-arcade` example demonstrating a multi-pane app with an assistive AI content slot and confirmed actions.

**Steps**:
1. Create `examples/agent-driven/14-incident-arcade/` package structure.
2. Reuse the env validation and streaming client from Task 1.
3. Implement a complex multi-pane host UI.
   - Include incident list, details pane, and a specific slot for AI-generated assistive content (summary, runbook, next actions).
4. Implement `ConfirmActionDialog` for dangerous remediation actions (e.g., "Restart Service", "Purge Queue").
5. Integrate the streaming renderer. Ensure the AI prompt instructs it to prefix all generated IDs with `incident-`.
6. Write the example-specific README.

**Verification**:
- Verify fail-fast on missing env vars.
- Verify AI content is confined to the assistive slot.
- Verify generated IDs are prefixed.
- Verify dangerous remediation actions trigger the confirmation dialog.

---

## Final Verification Wave
- [x] Repo-root `.env.example` exists documenting required variables.
- [x] All three examples fail fast when env vars are missing.
- [x] All three examples successfully connect, stream, and render AI UI slots when env vars are present.
- [x] The host UI remains stable during streaming and on malformed JSON.
- [x] Dangerous actions in Starship and Incident examples are protected by confirmation dialogs.
- [x] Each example has a README following the revised requirements (no offline mode mentioned).
