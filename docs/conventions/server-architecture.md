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

Paginated endpoints should define stable limits, ordering, and metadata. Clamp
or reject invalid page sizes, use parameterized SQL for values, and allowlist
dynamic sort fields rather than interpolating client input.

## Database boundary

`db.ts` owns connection setup and loading seed files. Seed parsing is an
untrusted file boundary: parse JSON as `unknown`, validate it with Joi, and pass
the resulting explicit contract to the service. Initialization
must be atomic or recover cleanly after interruption; the existence of a
database file alone is not proof that its schema and seed are complete.

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
