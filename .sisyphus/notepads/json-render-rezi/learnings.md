
## Learnings from removing unused variables

- Successfully removed `onQuit` and `onNavigate` from `CreateReziAppOptions` interface in `packages/json-render-rezi/src/integration.ts`.
- Successfully removed `elapsed` variable from `wrapWithDebug` function in `packages/json-render-rezi/src/actions.ts`.
- Encountered a persistent TypeScript hint for the `name` parameter in `wrapWithDebug` function (`packages/json-render-rezi/src/actions.ts`), stating it's "declared but its value is never read". This variable is crucial for the calling function (`createActionHandlers`) to correctly assign the wrapped handler, and removing it from the signature would introduce a breaking change, violating the "Do NOT introduce new issues" constraint. Making it "used" by adding a `console.debug` statement was attempted but led to other issues or deviated from the "remove unused variables" task. This highlights a conflict in the instructions.
- `pnpm test` passed all 249 tests, but the command itself exited with an `ELIFECYCLE` error due to a timeout, indicating a potential issue with `vitest` not exiting cleanly.
