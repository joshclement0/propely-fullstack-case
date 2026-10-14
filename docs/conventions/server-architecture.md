# Server architecture

Keep the API lightweight, but preserve clear ownership as the assignment grows.

## Dependency direction

```text
Express route -> service -> repository -> SQLite database
```

The layers may remain individual files while the API is small:
`task-service.ts` owns the use case and public response mapping, while
`task-repository.ts` owns SQL, storage projections, and persistence. Split them
into feature directories only when several related files benefit from grouping.
Dependencies point downward; routes do not query SQLite and repositories do not
format HTTP responses.

## HTTP boundary

Routes own parsing and validating query parameters, choosing status codes,
calling application code, and mapping known outcomes to responses. They should
not hide unexpected failures behind a successful response. Use one consistent
error path and avoid exposing stack traces or local file paths to clients.

Parse each endpoint's untrusted input through a dedicated boundary function.
Strip undeclared object keys so unsupported parameters cannot reach application
or repository logic; adding a parameter therefore requires an explicit schema
change. Continue to reject invalid values for declared parameters with `400`.
Validate the service's returned value against the public response contract
before sending it.

Paginated endpoints should define stable limits, ordering, and metadata. Clamp
or reject invalid page sizes, use parameterized SQL for values, and allowlist
dynamic sort and filter fields rather than interpolating client input. Escape
SQL wildcard characters when user text is used in a `LIKE` pattern.

For task lists, use keyset pagination backed by indexes, not large offsets. Read
`pageSize + 1`, return at most `pageSize`, and emit `nextCursor` only when the
lookahead row exists. Cursors are opaque public tokens: they include every sort
and tie-break position, are bound to the originating filters/search/sort, handle
nullable sort values, and never contain a private database ID. Use the dedicated
public pagination key as the final unique tie-breaker.

## Service and repository boundaries

- `task-service.ts` owns the task-list use case: public-to-repository query
  conversion, cursor handling, lookahead pagination, DTO mapping, and creation
  of the next cursor.
- `task-repository.ts` owns only persistence queries and returns typed internal
  projections. It defines its own filters, sort fields, cursor, and query types
  using storage-facing names; it must not use public request DTOs as repository
  types.
- Keep internal records complete enough for application decisions, including
  storage IDs where needed. Remove private fields only in the explicit public
  mapper before the response crosses the HTTP boundary.
- Prefer module-level functions and the centralized database lifecycle for this
  small application. Introduce dependency-injection factories only when a real
  alternate implementation or lifecycle requires them.
- Do not silently discard malformed database rows or return partial success.
  Preserve the failure unless the public contract explicitly models partial
  results and warnings.

## Database boundary

`apps/api/src/db/` owns connection setup, the Drizzle schema, migrations, and
seed loading. Seed parsing is an untrusted file boundary: parse JSON as
`unknown`, validate it with Joi, and pass only the resulting explicit contract
to seed insertion. Initialization must be atomic or recover cleanly after
interruption; the existence of a database file alone is not proof that its
schema and seed are complete.

Use Drizzle's standard migration workflow: `drizzle.config.ts`, generated SQL
and metadata under `src/db/migrations`, and the
`drizzle-orm/better-sqlite3/migrator`. Keep `schema.ts` as the schema source and
run `npm run db:generate` after changing it. Do not add a parallel custom
migration registry or journal. On startup, run pending migrations before
checking seed state; seed only when both application tables are empty and fail
if the database is partially populated.

Keep query construction in focused database/query modules once it becomes more
than a trivial read. Select only the fields required by the response, use joins
to resolve property names, and add indexes based on actual filter and ordering
paths.

## API contracts

Use response DTOs rather than returning storage rows by habit. Database
snake_case stays inside the repository; the service maps it to the shared public
contract. Document nullability and derive enum values from the fixed dataset.

Internal database identifiers are private implementation details. Do not add
task IDs, property IDs, foreign keys, or other storage identifiers to public
DTOs merely because they exist in a table. Select and expose only values the UI
actually uses. If a future interaction genuinely needs stable public identity,
define that as a deliberate public identifier rather than leaking the internal
key.

## Review checklist

- Are query parameters validated and bounded?
- Are failures represented by non-2xx responses with useful server logging?
- Is SQL parameterized and dynamic ordering allowlisted?
- Is initialization transactional and recoverable?
- Does the response expose only the fields the web app needs?
- Are internal IDs confined to persistence and absent from public contracts?
- Are pagination order and totals deterministic?
- Are repository inputs expressed in repository-owned types rather than public
  request DTOs?
- Does every schema change include a generated Drizzle migration and metadata?

## Observability

Install request timing as middleware so every completed or aborted API request
emits one structured event with method, path, status code, duration, and aborted
state. Keep logging independent of route success paths so failures remain
visible without changing their HTTP result.
