import { useEffect, useState } from 'react';

import {
  TASK_CATEGORIES,
  TASK_STATUSES,
  type PublicTaskPage,
  type TaskListQuery,
  type TaskSortField,
} from '@propely-case/contracts';

import { fetchTaskPage } from './api';
import { Button, Heading, Input, Select, Text, type SelectOption } from './components';
import { TaskTable } from './TaskTable';
import {
  DEFAULT_TASK_VIEW_QUERY,
  PAGE_SIZES,
  parseCategory,
  parsePageSize,
  parseStatus,
  parseTaskViewQuery,
  serializeTaskViewQuery,
  type TaskViewQuery,
} from './task-view-query';

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

const toApiQuery = (query: TaskViewQuery): TaskListQuery => ({
  filter: {
    ...(query.status ? { status: query.status } : {}),
    ...(query.category ? { category: query.category } : {}),
    ...(query.propertyName.trim() ? { property_name: query.propertyName.trim() } : {}),
  },
  ...(query.search.trim() ? { search: query.search.trim() } : {}),
  sortBy: query.sortBy,
  sortDirection: query.sortDirection,
  pageSize: query.pageSize,
  ...(query.cursor ? { cursor: query.cursor } : {}),
});

type HistoryMode = 'push' | 'replace';

const readTaskViewQuery = (): TaskViewQuery =>
  parseTaskViewQuery(new URLSearchParams(window.location.search));

const writeTaskViewQuery = (query: TaskViewQuery, mode: HistoryMode): void => {
  const search = serializeTaskViewQuery(query).toString();
  const url = `${window.location.pathname}?${search}${window.location.hash}`;

  if (mode === 'push') window.history.pushState(null, '', url);
  else window.history.replaceState(null, '', url);
};

export function App() {
  const [query, setQuery] = useState<TaskViewQuery>(readTaskViewQuery);
  const [page, setPage] = useState<PublicTaskPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previousCursors, setPreviousCursors] = useState<string[]>([]);

  useEffect(() => {
    writeTaskViewQuery(query, 'replace');

    const restoreQueryFromUrl = () => {
      setIsLoading(true);
      setQuery(readTaskViewQuery());
      setPreviousCursors([]);
    };

    window.addEventListener('popstate', restoreQueryFromUrl);
    return () => window.removeEventListener('popstate', restoreQueryFromUrl);
    // The initial query is intentionally captured once; later URL writes happen in updateQuery.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void fetchTaskPage(toApiQuery(query), controller.signal)
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
  }, [query]);

  const updateQuery = (updates: Partial<TaskViewQuery>, historyMode: HistoryMode = 'push') => {
    const nextQuery = { ...query, ...updates, cursor: '', page: 1 };
    setIsLoading(true);
    setQuery(nextQuery);
    writeTaskViewQuery(nextQuery, historyMode);
    setPreviousCursors([]);
  };

  const changeSort = (field: TaskSortField) => {
    updateQuery({
      sortBy: field,
      sortDirection: query.sortBy === field && query.sortDirection === 'asc' ? 'desc' : 'asc',
    });
  };

  const goNext = () => {
    if (!page?.nextCursor) return;
    const nextQuery = {
      ...query,
      cursor: page.nextCursor,
      page: query.page + 1,
    };
    setIsLoading(true);
    setPreviousCursors((cursors) => [...cursors, query.cursor]);
    setQuery(nextQuery);
    writeTaskViewQuery(nextQuery, 'push');
  };

  const goPrevious = () => {
    const previousCursor = previousCursors.at(-1);
    if (previousCursor === undefined) return;

    const nextQuery = {
      ...query,
      cursor: previousCursor,
      page: Math.max(1, query.page - 1),
    };
    setIsLoading(true);
    setPreviousCursors((cursors) => cursors.slice(0, -1));
    setQuery(nextQuery);
    writeTaskViewQuery(nextQuery, 'push');
  };

  const retry = () => {
    setIsLoading(true);
    setQuery((current) => ({ ...current }));
  };

  const clearFilters = () => updateQuery(DEFAULT_TASK_VIEW_QUERY);

  const downloadPdf = async () => {
    if (!page?.items.length) return;

    setIsDownloading(true);
    setDownloadError(null);
    try {
      const { downloadTasksPdf } = await import('./pdf');
      downloadTasksPdf(page.items);
    } catch (downloadFailure: unknown) {
      setDownloadError(downloadFailure instanceof Error ? downloadFailure.message : 'Ukjent feil');
    } finally {
      setIsDownloading(false);
    }
  };

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
              onChange={(event) => updateQuery({ search: event.target.value }, 'replace')}
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
              onChange={(event) => updateQuery({ propertyName: event.target.value }, 'replace')}
              placeholder="F.eks. Åkerveien 3"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <Button
              title={isDownloading ? 'Lager PDF …' : 'Last ned som PDF'}
              variant="primary"
              disabled={!page?.items.length || isLoading || isDownloading}
              onClick={() => void downloadPdf()}
            />
            <Button title="Nullstill" variant="ghost" onClick={clearFilters} />
          </div>
        </section>

        {downloadError && (
          <div
            role="alert"
            className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            Kunne ikke lage PDF: {downloadError}
          </div>
        )}

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
                Side {query.page}
              </Text>
              <Button
                title="← Forrige"
                disabled={previousCursors.length === 0 || isLoading}
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
