# Propely Fullstack Engineer Case: Starter repo

A deliberately plain starting point for the technical case assignment. It gives you a
local API serving 1000 property maintenance tasks and a React page that
dumps all of them into a table. Nothing more.

This repo intentionally does **not** contain filtering, search, pagination or PDF
export, and it does not resolve property names. Building that is the assignment (full
requirements at the bottom).

## Getting started

The recommended development setup requires Docker Desktop. Start the API and web app together:

```bash
npm run dev:docker
```

or if docker compose is installed

```bash
docker compose up
```

optional flags --build, --force-recreate and -d are also recommended

Docker Compose builds separate Node 22 browser and server images from
`apps/web/Dockerfile` and `apps/api/Dockerfile`, using workspace-focused dependencies. It
initializes SQLite in a named volume and starts both apps with hot reload. The two containers use
separate `node_modules` volumes. Stop the stack with:

```bash
npm run dev:docker:down
```

or if docker compose is installed

```bash
docker compose down
```

optional flags -v to destroy all volumes

| App                | URL                                            | Notes                                   |
| ------------------ | ---------------------------------------------- | --------------------------------------- |
| API (Express)      | [http://localhost:8080](http://localhost:8080) | SQLite data persists in a Docker volume |
| Web (Vite + React) | [http://localhost:3000](http://localhost:3000) | Calls the API through port `8080`       |

The API writes one structured timing entry for every completed or aborted request. Follow the
request timings with:

```bash
docker compose logs --follow api
```

### Run without Docker

Local development requires **Node 22 or newer**. Any way of installing it works, and nvm is not
required. If you do use nvm, `.nvmrc` pins the version for you:

```bash
nvm use            # optional, picks up Node 22 from .nvmrc
npm install
```

Then start the two apps in **two separate terminals**:

```bash
npm run dev:api    # terminal 1
npm run dev:web    # terminal 2
```

On first start the API creates `apps/api/tasks.db` from `seed/tasks.json` and
`seed/properties.json`. The db file is gitignored and rebuilt from the seed, so you can
always get back to a clean dataset: delete the file and restart the API.

`npm test` runs focused contract, repository, service, and text-conversion tests.

### Development checks

The repository includes shared formatting, lint, and TypeScript conventions:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
npm test
```

The checks are available from the repository root and cover every workspace.

## API contract

Current endpoints. You are free to change or replace them (see below).

### `GET /api/health`

```json
{ "status": "ok" }
```

### `GET /api/tasks`

Returns matching tasks in a paginated response object. All query parameters are
optional and can be combined. Filters use bracket notation to form one `filter`
object whose keys match the repository's database projection:

| Parameter               | Accepted values                                                                             | Default     |
| ----------------------- | ------------------------------------------------------------------------------------------- | ----------- |
| `filter[status]`        | One or more of `New`, `InProgress`, `Completed`, `Rejected`                                 | all         |
| `filter[category]`      | One or more of `FireSafety`, `Plumbing`, `Electrical`, `Ventilation`, `Cleaning`, `Outdoor` | all         |
| `filter[property_name]` | Exact property name                                                                         | all         |
| `search`                | Text contained in the task title or property name                                           | none        |
| `sortBy`                | `title`, `category`, `status`, `propertyName`, `createdAt`, `dueDate`, `costNok`            | `createdAt` |
| `sortDirection`         | `asc`, `desc`                                                                               | `desc`      |
| `cursor`                | Opaque cursor returned by the previous page                                                 | none        |
| `pageSize`              | Integer from `1` to `100`                                                                   | `25`        |

Unsupported parameters are stripped at the HTTP validation boundary, while invalid
values for supported parameters return `400`. Sorting is deterministic, and internal
task and property IDs are never returned. The database reads
`pageSize + 1` tasks to detect another page, returns at most `pageSize` items,
and supplies `nextCursor` when another page exists. Cursors are valid only with
the same filters, search, and sorting that created them.

For example:

```text
/api/tasks?filter[status]=New&filter[status]=InProgress&filter[category]=Outdoor&sortBy=createdAt&sortDirection=desc&pageSize=25
```

```json
{
  "items": [
    {
      "title": "Skifte lyskilder til LED i garasje",
      "description": "Midlertidig løsning på plass. Permanent utbedring gjenstår.",
      "category": "Electrical",
      "status": "InProgress",
      "propertyName": "Torvhaugen Næringsbygg",
      "createdAt": "2025-12-25",
      "dueDate": "2026-03-01",
      "costNok": 8100
    }
  ],
  "nextCursor": "eyJ2ZXJzaW9uIjoxLC4uLn0"
}
```

CORS is wide open (all origins), which covers the Vite dev server. There is no auth.

## Data model

Two tables in a single local SQLite file, queried through Drizzle ORM over
`better-sqlite3`: `tasks` and `properties`. `tasks.property_id` is a foreign key
into `properties.id`, and the task row holds no property name of its own.

### `properties`

| Column | Type | Null | Notes                                                  |
| ------ | ---- | ---- | ------------------------------------------------------ |
| `id`   | TEXT | no   | primary key, e.g. `prop-011`                           |
| `name` | TEXT | no   | Norwegian free text, 40 rows, some 70 to 90 chars long |

### `tasks`

| Column           | Type    | Null    | Notes                                                  |
| ---------------- | ------- | ------- | ------------------------------------------------------ |
| `id`             | TEXT    | no      | primary key                                            |
| `title`          | TEXT    | no      | Norwegian free text                                    |
| `description`    | TEXT    | no      | Norwegian free text, mostly short, some 400–800 chars  |
| `category`       | TEXT    | no      | enum, CHECK constraint                                 |
| `status`         | TEXT    | no      | enum, CHECK constraint                                 |
| `pagination_key` | TEXT    | no      | unique public key used only inside pagination cursors  |
| `property_id`    | TEXT    | no      | foreign key into `properties.id`, unevenly distributed |
| `created_at`     | TEXT    | no      | ISO 8601 date, spread across 2022–2026                 |
| `due_date`       | TEXT    | **yes** | ISO 8601 date, null in ~19 % of rows                   |
| `cost_nok`       | INTEGER | **yes** | 300 – ~470 000, null in ~12 % of rows                  |

### Seed data

`seed/tasks.json` is the single source of truth for the dataset, and is never
regenerated at runtime. The data is deliberately messy: Norwegian characters, long
property names, long compound words, some very long descriptions, nulls, a wide cost
range and a skewed status distribution (roughly 55 % Completed, 22 % InProgress,
20 % New, 3 % Rejected). Expect it to stress your table layout and formatting.

Please treat `seed/tasks.json` and `seed/properties.json` as fixed input and leave them
as they are. The data is meant to be awkward, and working with it as-is is part of the
exercise.

## Your assignment

Extend the existing task table with new features/improvements. Use no more than 1 to 3 hours.

All five of the following are **required**:

1. **Show the property name, not the id.** The table currently prints the raw
   `property_id` (`prop-011`). It should show the property name (`Åkerveien 3`).
2. **Filtering.** The user must be able to narrow the table by at least `status`,
   `category` and property. Multiple filters must work together.
3. **Search.** A free-text search across some columns (at minimum `title`, and
   ideally `property`_id). It must work together with the filters.
4. **Pagination.** The table must be paginated rather than rendering all 1000 rows at
   once. Page size is up to you.
5. **A "Download as PDF" button** that exports the task table as a PDF. The export must
   reflect what the user is currently looking at, so the active filters and search apply to it.

### How you build it is up to you

- add any dependencies you want
- change the API however you like, including adding, changing or replacing endpoints
- change or restructure the frontend however you like

### Out of scope

- Authentication
- Design beyond plain readability
- Deployment
- Tests beyond what proves your core logic works

### Practical notes

- Everything runs locally. No cloud service or signup is needed for anything.
- We want to see **several commits along the way**, not one large commit at the end.  
  Commit as you go so we can follow your reasoning.
- Share your Github repo with "Lunke" (Kristoffer Lundquist) no later than 3 hours before the meeting.
- Bring your computer with the case to the meeting, so we can discuss it and improve it together.
