import { useEffect, useMemo, useState } from 'react';

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
  parsePageSize,
  parseTaskViewQuery,
  serializeTaskViewQuery,
  type TaskViewQuery,
} from './task-view-query';
import { TASK_FIELDS, TASK_FIELD_LABELS, type TaskField } from './task-fields';

const PAGE_SIZE_OPTIONS: readonly SelectOption[] = PAGE_SIZES.map((size) => ({
  value: String(size),
  label: String(size),
}));

type TaskApiViewQuery = Pick<
  TaskViewQuery,
  | 'statuses'
  | 'categories'
  | 'propertyName'
  | 'search'
  | 'sortBy'
  | 'sortDirection'
  | 'pageSize'
  | 'cursor'
>;

const toApiQuery = (query: TaskApiViewQuery): TaskListQuery => ({
  filter: {
    ...(query.statuses.length ? { status: query.statuses } : {}),
    ...(query.categories.length ? { category: query.categories } : {}),
    ...(query.propertyName.trim() ? { property_name: query.propertyName.trim() } : {}),
  },
  ...(query.search.trim() ? { search: query.search.trim() } : {}),
  sortBy: query.sortBy,
  sortDirection: query.sortDirection,
  pageSize: query.pageSize,
  ...(query.cursor ? { cursor: query.cursor } : {}),
});

interface CheckboxGroupProps<T extends string> {
  legend: string;
  options: readonly T[];
  selected: readonly T[];
  onToggle: (value: T) => void;
}

function CheckboxGroup<T extends string>({
  legend,
  options,
  selected,
  onToggle,
}: CheckboxGroupProps<T>) {
  return (
    <fieldset>
      <legend className="mb-1 block text-sm font-medium text-slate-700">{legend}</legend>
      <div className="flex min-h-10 flex-wrap gap-x-3 gap-y-1 rounded-md border border-slate-300 bg-white px-3 py-2">
        {options.map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-center gap-1.5 text-sm text-slate-700"
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

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
  const [requestAttempt, setRequestAttempt] = useState(0);
  const apiQuery = useMemo(
    () =>
      toApiQuery({
        statuses: query.statuses,
        categories: query.categories,
        propertyName: query.propertyName,
        search: query.search,
        sortBy: query.sortBy,
        sortDirection: query.sortDirection,
        pageSize: query.pageSize,
        cursor: query.cursor,
      }),
    [
      query.statuses,
      query.categories,
      query.propertyName,
      query.search,
      query.sortBy,
      query.sortDirection,
      query.pageSize,
      query.cursor,
    ],
  );
  const visibleFields = TASK_FIELDS.filter((field) => !query.hiddenFields.includes(field));

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

    void fetchTaskPage(apiQuery, controller.signal)
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
  }, [apiQuery, requestAttempt]);

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

  const toggleStatus = (status: (typeof TASK_STATUSES)[number]) => {
    updateQuery({
      statuses: query.statuses.includes(status)
        ? query.statuses.filter((value) => value !== status)
        : [...query.statuses, status],
    });
  };

  const toggleCategory = (category: (typeof TASK_CATEGORIES)[number]) => {
    updateQuery({
      categories: query.categories.includes(category)
        ? query.categories.filter((value) => value !== category)
        : [...query.categories, category],
    });
  };

  const toggleField = (field: TaskField) => {
    const isHidden = query.hiddenFields.includes(field);
    if (!isHidden && visibleFields.length === 1) return;

    const nextQuery = {
      ...query,
      hiddenFields: isHidden
        ? query.hiddenFields.filter((value) => value !== field)
        : [...query.hiddenFields, field],
    };
    setQuery(nextQuery);
    writeTaskViewQuery(nextQuery, 'push');
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
    setRequestAttempt((attempt) => attempt + 1);
  };

  const clearFilters = () => updateQuery(DEFAULT_TASK_VIEW_QUERY);

  const downloadPdf = async () => {
    if (!page?.items.length) return;

    setIsDownloading(true);
    setDownloadError(null);
    try {
      const { downloadTasksPdf } = await import('./pdf');
      const activeFilters = [
        query.search.trim() ? `Søk: ${query.search.trim()}` : '',
        query.statuses.length ? `Status: ${query.statuses.join(', ')}` : '',
        query.categories.length ? `Kategori: ${query.categories.join(', ')}` : '',
        query.propertyName.trim() ? `Eiendom: ${query.propertyName.trim()}` : '',
      ].filter(Boolean);
      downloadTasksPdf(page.items, { visibleFields, activeFilters });
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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <Input
              title="Søk i tittel eller eiendom"
              type="search"
              value={query.search}
              onChange={(event) => updateQuery({ search: event.target.value }, 'replace')}
              placeholder="Skriv for å søke …"
              containerClassName="xl:col-span-2"
            />

            <CheckboxGroup
              legend="Status"
              options={TASK_STATUSES}
              selected={query.statuses}
              onToggle={toggleStatus}
            />

            <CheckboxGroup
              legend="Kategori"
              options={TASK_CATEGORIES}
              selected={query.categories}
              onToggle={toggleCategory}
            />

            <Input
              title="Eiendom (eksakt navn)"
              type="text"
              value={query.propertyName}
              onChange={(event) => updateQuery({ propertyName: event.target.value }, 'replace')}
              placeholder="F.eks. Åkerveien 3"
              containerClassName="xl:col-span-2"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                title={isDownloading ? 'Lager PDF …' : 'Last ned som PDF'}
                variant="primary"
                disabled={!page?.items.length || isLoading || isDownloading}
                onClick={() => void downloadPdf()}
              />
              <details className="relative">
                <summary className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Vis felt ({visibleFields.length}/{TASK_FIELDS.length})
                </summary>
                <fieldset className="absolute left-0 z-20 mt-2 min-w-48 rounded-md border border-slate-200 bg-white p-3 shadow-lg">
                  <legend className="sr-only">Velg synlige felt</legend>
                  {TASK_FIELDS.map((field) => {
                    const isVisible = visibleFields.includes(field);
                    return (
                      <label
                        key={field}
                        className="flex items-center gap-2 py-1 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={isVisible}
                          disabled={isVisible && visibleFields.length === 1}
                          onChange={() => toggleField(field)}
                        />
                        {TASK_FIELD_LABELS[field]}
                      </label>
                    );
                  })}
                </fieldset>
              </details>
            </div>
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
              visibleFields={visibleFields}
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
