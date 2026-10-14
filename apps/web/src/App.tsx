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
import { TaskTable } from './TaskTable';

const PAGE_SIZES = [20, 50, 100] as const;

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
        <h1 className="text-xl font-semibold">Vedlikeholdsoppgaver</h1>
        <p className="mt-1 text-sm text-slate-500">Søk, filtrer og sorter oppgavelisten.</p>
      </header>

      <main className="p-4 sm:p-6">
        <section
          aria-label="Filtrer oppgaver"
          className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="text-sm font-medium text-slate-700 xl:col-span-2">
              Søk i tittel eller eiendom
              <input
                type="search"
                value={query.search}
                onChange={(event) => updateQuery({ search: event.target.value })}
                placeholder="Skriv for å søke …"
                className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 font-normal shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Status
              <select
                value={query.status}
                onChange={(event) => updateQuery({ status: parseStatus(event.target.value) })}
                className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 font-normal shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
              >
                <option value="">Alle statuser</option>
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Kategori
              <select
                value={query.category}
                onChange={(event) => updateQuery({ category: parseCategory(event.target.value) })}
                className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 font-normal shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
              >
                <option value="">Alle kategorier</option>
                {TASK_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Eiendom (eksakt navn)
              <input
                type="text"
                value={query.propertyName}
                onChange={(event) => updateQuery({ propertyName: event.target.value })}
                placeholder="F.eks. Åkerveien 3"
                className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 font-normal shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
              />
            </label>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-600"
            >
              Nullstill
            </button>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="mb-4 flex items-center justify-between gap-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <span>Kunne ikke hente oppgaver: {error}</span>
            <button
              type="button"
              onClick={retry}
              className="rounded border border-red-300 px-3 py-1 font-medium hover:bg-red-100"
            >
              Prøv igjen
            </button>
          </div>
        )}

        <div className="relative" aria-busy={isLoading}>
          {isLoading && page && (
            <div className="absolute inset-x-0 top-0 z-10 h-1 animate-pulse bg-sky-600" />
          )}
          {!error && isLoading && !page && (
            <p className="py-8 text-center text-sm text-slate-500">Laster oppgaver …</p>
          )}
          {!error && !isLoading && page?.items.length === 0 && (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-12 text-center">
              <p className="font-medium">Ingen oppgaver funnet</p>
              <p className="mt-1 text-sm text-slate-500">Prøv å endre søket eller filtrene.</p>
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
            <label className="text-sm text-slate-600">
              Oppgaver per side
              <select
                value={query.pageSize}
                onChange={(event) => updateQuery({ pageSize: parsePageSize(event.target.value) })}
                className="ml-2 rounded border border-slate-300 bg-white px-2 py-1.5 text-slate-900"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">Side {pageIndex + 1}</span>
              <button
                type="button"
                disabled={pageIndex === 0 || isLoading}
                onClick={goPrevious}
                className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ← Forrige
              </button>
              <button
                type="button"
                disabled={!page.nextCursor || isLoading}
                onClick={goNext}
                className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Neste →
              </button>
            </div>
          </nav>
        )}
      </main>
    </div>
  );
}
