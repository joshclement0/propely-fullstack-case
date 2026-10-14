import { useEffect, useState } from 'react';

import {
  TASK_CATEGORIES,
  TASK_STATUSES,
  type PublicTaskPage,
  type TaskCategory,
  type TaskListQuery,
  type TaskSortDirection,
  type TaskSortField,
  type TaskStatus,
} from '@propely-case/contracts';

import { fetchTaskPage } from './api';
import { Button, Heading, Input, Select, Text, type SelectOption } from './components';
import { TaskTable } from './TaskTable';

const PAGE_SIZES = [20, 50, 100] as const;

const STATUS_OPTIONS: readonly SelectOption[] = [
  { value: '', label: 'Alle statuser' },
  ...TASK_STATUSES.map((status) => ({ value: status, label: status })),
];

const CATEGORY_OPTIONS: readonly SelectOption[] = [
  { value: '', label: 'Alle kategorier' },
  ...TASK_CATEGORIES.map((category) => ({ value: category, label: category })),
];

const PAGE_SIZE_OPTIONS: readonly SelectOption[] = PAGE_SIZES.map((size) => ({
  value: String(size),
  label: String(size),
}));

interface TaskViewQuery {
  search: string;
  status: TaskStatus | '';
  category: TaskCategory | '';
  propertyName: string;
  sortBy: TaskSortField;
  sortDirection: TaskSortDirection;
  pageSize: (typeof PAGE_SIZES)[number];
}

const INITIAL_QUERY: TaskViewQuery = {
  search: '',
  status: '',
  category: '',
  propertyName: '',
  sortBy: 'createdAt',
  sortDirection: 'desc',
  pageSize: 20,
};

const parseStatus = (value: string): TaskStatus | '' =>
  TASK_STATUSES.find((status) => status === value) ?? '';

const parseCategory = (value: string): TaskCategory | '' =>
  TASK_CATEGORIES.find((category) => category === value) ?? '';

const parsePageSize = (value: string): TaskViewQuery['pageSize'] => {
  const pageSize = Number(value);
  return PAGE_SIZES.find((size) => size === pageSize) ?? INITIAL_QUERY.pageSize;
};

const toApiQuery = (query: TaskViewQuery, cursor?: string): TaskListQuery => ({
  filter: {
    ...(query.status ? { status: query.status } : {}),
    ...(query.category ? { category: query.category } : {}),
    ...(query.propertyName.trim() ? { property_name: query.propertyName.trim() } : {}),
  },
  ...(query.search.trim() ? { search: query.search.trim() } : {}),
  sortBy: query.sortBy,
  sortDirection: query.sortDirection,
  pageSize: query.pageSize,
  ...(cursor ? { cursor } : {}),
});

export function App() {
  const [query, setQuery] = useState<TaskViewQuery>(INITIAL_QUERY);
  const [page, setPage] = useState<PublicTaskPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>([undefined]);
  const [pageIndex, setPageIndex] = useState(0);
  const cursor = cursorHistory[pageIndex];

  useEffect(() => {
    const controller = new AbortController();

    void fetchTaskPage(toApiQuery(query, cursor), controller.signal)
      .then((result) => {
        setPage(result);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError(requestError instanceof Error ? requestError.message : 'Ukjent feil');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [cursor, query]);

  const updateQuery = (updates: Partial<TaskViewQuery>) => {
    setIsLoading(true);
    setQuery((current) => ({ ...current, ...updates }));
    setCursorHistory([undefined]);
    setPageIndex(0);
  };

  const changeSort = (field: TaskSortField) => {
    updateQuery({
      sortBy: field,
      sortDirection: query.sortBy === field && query.sortDirection === 'asc' ? 'desc' : 'asc',
    });
  };

  const goNext = () => {
    if (!page?.nextCursor) return;
    setIsLoading(true);
    setCursorHistory((history) => [
      ...history.slice(0, pageIndex + 1),
      page.nextCursor ?? undefined,
    ]);
    setPageIndex((index) => index + 1);
  };

  const goPrevious = () => {
    if (pageIndex === 0) return;
    setIsLoading(true);
    setPageIndex((index) => index - 1);
  };

  const retry = () => {
    setIsLoading(true);
    setQuery((current) => ({ ...current }));
  };

  const clearFilters = () => updateQuery(INITIAL_QUERY);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6">
        <Heading level={1}>Vedlikeholdsoppgaver</Heading>
        <Text size="sm" tone="muted" className="mt-1">
          Søk, filtrer og sorter oppgavelisten.
        </Text>
      </header>

      <main className="p-4 sm:p-6">
        <section
          aria-label="Filtrer oppgaver"
          className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Input
              title="Søk i tittel eller eiendom"
              type="search"
              value={query.search}
              onChange={(event) => updateQuery({ search: event.target.value })}
              placeholder="Skriv for å søke …"
              containerClassName="xl:col-span-2"
            />

            <Select
              title="Status"
              value={query.status}
              options={STATUS_OPTIONS}
              onChange={(event) => updateQuery({ status: parseStatus(event.target.value) })}
            />

            <Select
              title="Kategori"
              value={query.category}
              options={CATEGORY_OPTIONS}
              onChange={(event) => updateQuery({ category: parseCategory(event.target.value) })}
            />

            <Input
              title="Eiendom (eksakt navn)"
              type="text"
              value={query.propertyName}
              onChange={(event) => updateQuery({ propertyName: event.target.value })}
              placeholder="F.eks. Åkerveien 3"
            />
          </div>

          <div className="mt-3 flex justify-end">
            <Button title="Nullstill" variant="ghost" onClick={clearFilters} />
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="mb-4 flex items-center justify-between gap-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <Text as="span" size="sm" tone="danger">
              Kunne ikke hente oppgaver: {error}
            </Text>
            <Button title="Prøv igjen" variant="danger" onClick={retry} className="py-1" />
          </div>
        )}

        <div className="relative" aria-busy={isLoading}>
          {isLoading && page && (
            <div className="absolute inset-x-0 top-0 z-10 h-1 animate-pulse bg-sky-600" />
          )}
          {!error && isLoading && !page && (
            <Text size="sm" tone="muted" className="py-8 text-center">
              Laster oppgaver …
            </Text>
          )}
          {!error && !isLoading && page?.items.length === 0 && (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-12 text-center">
              <Text weight="medium">Ingen oppgaver funnet</Text>
              <Text size="sm" tone="muted" className="mt-1">
                Prøv å endre søket eller filtrene.
              </Text>
            </div>
          )}
          {!error && page && page.items.length > 0 && (
            <TaskTable
              tasks={page.items}
              sortBy={query.sortBy}
              sortDirection={query.sortDirection}
              onSort={changeSort}
            />
          )}
        </div>

        {page && !error && (
          <nav
            aria-label="Paginering"
            className="mt-4 flex flex-wrap items-center justify-between gap-3"
          >
            <Select
              title="Oppgaver per side"
              value={query.pageSize}
              options={PAGE_SIZE_OPTIONS}
              onChange={(event) => updateQuery({ pageSize: parsePageSize(event.target.value) })}
              containerClassName="flex items-center gap-2 text-slate-600"
              className="mt-0 w-auto px-2 py-1.5"
            />

            <div className="flex items-center gap-3">
              <Text as="span" size="sm" tone="muted">
                Side {pageIndex + 1}
              </Text>
              <Button
                title="← Forrige"
                disabled={pageIndex === 0 || isLoading}
                onClick={goPrevious}
              />
              <Button title="Neste →" disabled={!page.nextCursor || isLoading} onClick={goNext} />
            </div>
          </nav>
        )}
      </main>
    </div>
  );
}
