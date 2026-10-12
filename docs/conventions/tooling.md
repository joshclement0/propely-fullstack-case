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

`AGENTS.md` is the canonical agent instruction file. A colocated `CLAUDE.md`
imports it so Codex and Claude Code receive the same rules without duplicated
guidance.
