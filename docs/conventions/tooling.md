# Tooling conventions

Repository workflows must work on Windows and macOS.

- Use root `npm` scripts as the canonical entry points.
- Keep package scripts short. Put non-trivial branching, filesystem work, or
  cleanup in a Node.js script rather than shell-specific syntax.
- Do not require Bash, PowerShell, WSL, Homebrew, or GNU-only utilities for the
  normal workflow.
- Use Node APIs and `path`/`URL` for portable paths and subprocess arguments.
- Keep temporary files in the operating system temp directory or a local
  ignored directory and clean them up safely.
- Never print secrets or rewrite `.env` files as a side effect of an unrelated
  command.
- Report which platforms were actually checked. One-platform validation is not
  proof of cross-platform behavior.

## Docker development

- Keep separate Dockerfiles for the API and web workspaces. Each image should
  install only its own workspace dependencies plus shared contracts.
- Preserve the API's installed dependencies from its rebuilt image. Do not
  mount a persistent `node_modules` volume over them; stale volumes can hide
  newly added server packages. Bind-mount only the API source, shared contract
  source, and read-only seed input needed for hot reload.
- Keep the SQLite file in its own named data volume. The web container may use
  its own `node_modules` volume when the workspace bind mount would otherwise
  hide image dependencies; never share that volume with the API.
- Use the API health check to order local startup. A successful image build is
  not proof that the service starts against existing volumes, so verify service
  health after dependency, migration, or Compose changes.
- Use Node 22 consistently for local, container, and CI checks. Native modules
  such as `better-sqlite3` must be installed or rebuilt for the Node runtime
  that executes tests.

`AGENTS.md` is the canonical agent instruction file. A colocated `CLAUDE.md`
imports it so Codex and Claude Code receive the same rules without duplicated
guidance.
