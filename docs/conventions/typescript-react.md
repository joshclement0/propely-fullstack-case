# TypeScript and React conventions

These conventions adapt the Ode application rules to this repository's Vite,
React, and Express stack.

## TypeScript baseline

- Prefer the simplest type that expresses the contract.
- Use `import type` and `export type` for type-only boundaries.
- Do not use `any`, `@ts-ignore`, non-null assertions, or unchecked casts to
  bypass a design problem. Narrow `unknown` at the boundary instead.
- Keep API response types faithful to nullable fields and every supported enum
  member. API and web code import the public task type from the shared contracts
  workspace; do not recreate it locally.
- Let Prettier and ESLint own mechanical style. Avoid unrelated formatting
  churn in behavioral changes.
- Explain non-obvious public contracts with JSDoc; comments should explain
  intent, not narrate code.

## React ownership

Separate responsibilities when a component gains independent reasons to
change:

1. page composition and loading/error/empty states;
2. remote data collection and mutation;
3. derived view state such as filters, search, sorting, and pagination;
4. focused display components;
5. browser-only interactions such as PDF download.

Keep state at the narrowest common owner. Prefer derived values over mirrored
state, and memoize only when measurement or referential stability requires it.
Never mutate props or API cache values while sorting or filtering; use immutable
array methods or copy first.

## Remote data and query state

- Treat the shared contract as a compile-time dependency and the network as an
  untrusted runtime boundary. Check non-2xx responses and validate decoded JSON
  before storing or rendering it.
- Keep search, filters, sorting, page size, and the current cursor in one
  explicit query model. Serialize that model in the API module rather than
  constructing query strings throughout components.
- Cancel superseded requests with `AbortController`. An aborted request is not
  a user-visible failure, but every other rejection must leave loading state and
  surface a recoverable error.
- Cursor navigation may keep a client-side history for Back, but changing any
  filter, search term, sort, or page size must reset that history to the first
  page. Never derive or edit opaque cursors in the browser.
- Format dates and currency for the Norwegian UI at the presentation boundary;
  keep API values in their contract form.

## Rendering and accessibility

- Render user-controlled text as text. Do not use `dangerouslySetInnerHTML` for
  legacy markup; convert tags to plain-text line breaks. If rich HTML becomes a
  real requirement, sanitize it at an explicit trust boundary.
- Do not display or retain internal database IDs in browser contracts or UI.
  Build labels from user-facing fields such as the property name. If React needs
  a key and no public ID exists, derive a presentation-only key from stable
  public values rather than exposing a storage identifier.
- Prefer semantic HTML and associated labels. Interactive controls must be
  keyboard accessible and expose useful loading and disabled states.
- Treat loading, empty results, request failure, and retry as distinct states.
- Keep tables readable with long Norwegian text, null values, and narrow
  viewports. Do not rely on color alone to convey status.

## Frontend components

- Reuse the primitives in `apps/web/src/components` for ordinary form controls,
  actions, headings, and body text. Keep page-specific layout and behavior in
  the owning feature component.
- `Input` accepts a visible `title` and standard HTML input props. `Select`
  accepts a visible `title`, an `options` array of `{ value, label, disabled? }`,
  and standard HTML select props. Both generate an input id when one is not
  supplied and associate the title with the control using a semantic label.
- `Button` accepts its visible `title`, a `variant` (`primary`, `secondary`,
  `ghost`, or `danger`), and standard HTML button props. It defaults to
  `type="button"` so adding a button to a form does not accidentally submit it.
- Use `Heading` with an explicit semantic `level` and `Text` with `size`, `tone`,
  and `weight` when the standard type scale is sufficient. Use `className` only
  for contextual layout such as spacing or alignment, not to redefine the
  component's base appearance.
- Extend a primitive only after a repeated product need appears. A specialized
  interaction, such as a compact table-sort control, may remain local when
  forcing it into a general primitive would make the public API less clear.

## Review checklist

- Do client types exactly match the API contract?
- Are unknown network responses validated before entering application state?
- Are rejected requests and non-2xx responses visible and recoverable?
- Is derived data computed without mutating its source?
- Are list keys stable and is rendered text safe?
- Can filters, search, pagination, and export share one explicit query state?
- Does every query change reset cursor history and cancel obsolete requests?
