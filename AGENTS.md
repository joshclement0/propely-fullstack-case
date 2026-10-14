# Propely case agent instructions

## Scope and source of truth

These instructions apply to the entire repository. The assignment and its
constraints are defined in `README.md`. Treat `seed/tasks.json` and
`seed/properties.json` as immutable input.

Before changing TypeScript or React code, read
`docs/conventions/typescript-react.md`. Before changing the API, database, or
data access, also read `docs/conventions/server-architecture.md`. Before
changing scripts or package commands, read `docs/conventions/tooling.md`.

## Working agreement

- Keep changes small, vertical, and easy to explain in a review.
- Prefer explicit contracts and straightforward code over speculative
  abstractions. This is a time-boxed case, not a framework-building exercise.
- Keep the web app independent from API implementation files. Public API types
  belong in `packages/contracts`; do not duplicate them between workspaces.
- Validate untrusted data at HTTP and seed-file boundaries. Do not use `any`,
  unchecked casts, or non-null assertions to hide uncertainty.
- Preserve useful errors. Do not turn failures into successful empty responses.
- Keep secrets, local databases, generated output, and production data out of
  version control.
- Add dependencies only when they materially reduce implementation or
  maintenance risk.

## Repository boundaries

- `apps/web/src/` owns presentation, browser interaction, and calls to the API.
- `apps/api/src/server.ts` owns HTTP transport concerns: request parsing,
  validation, status codes, and response mapping.
- `apps/api/src/task-service.ts` owns task use cases and public DTO mapping.
- `apps/api/src/task-repository.ts` owns task SQL and storage projections.
- `apps/api/src/db/` owns SQLite lifecycle, the Drizzle schema and migrations,
  and seed validation and initialization.
- `seed/` is fixed source data, not application output.
- Internal task and property IDs stay inside persistence. Never send them in a
  public response or render them in the browser without a documented product
  need for public identity.

## Validation

Run the smallest relevant checks while iterating, then run formatting, lint,
typechecking, tests, and the web build as applicable before handoff. Report
checks actually run and call out missing proof; the placeholder test command is
not evidence of application correctness.

When reviewing code, prioritize correctness, data safety, error behavior,
accessibility, contract consistency, and test evidence before style.
