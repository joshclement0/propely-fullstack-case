import type { PublicTask, TaskSortDirection, TaskSortField } from '@propely-case/contracts';

import { htmlTagsToNewlines } from './text';

interface Column {
  label: string;
  sortField: TaskSortField;
  align?: 'right';
}

const COLUMNS: Column[] = [
  { label: 'Oppgave', sortField: 'title' },
  { label: 'Kategori', sortField: 'category' },
  { label: 'Status', sortField: 'status' },
  { label: 'Eiendom', sortField: 'propertyName' },
  { label: 'Opprettet', sortField: 'createdAt' },
  { label: 'Frist', sortField: 'dueDate' },
  { label: 'Kostnad', sortField: 'costNok', align: 'right' },
];

const taskRowKey = (task: PublicTask): string =>
  [task.propertyName, task.title, task.createdAt, task.description].join('\u0000');

const formatDate = (value: string | null): string => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('nb-NO').format(new Date(`${value}T00:00:00`));
};

const formatCost = (value: number | null): string => {
  if (value === null) return '—';
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: 0,
  }).format(value);
};

interface TaskTableProps {
  tasks: PublicTask[];
  sortBy: TaskSortField;
  sortDirection: TaskSortDirection;
  onSort: (field: TaskSortField) => void;
}

export function TaskTable({ tasks, sortBy, sortDirection, onSort }: TaskTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
          <tr>
            {COLUMNS.map(({ label, sortField, align }) => {
              const isActive = sortBy === sortField;
              const ariaSort = isActive
                ? sortDirection === 'asc'
                  ? 'ascending'
                  : 'descending'
                : 'none';

              return (
                <th
                  key={sortField}
                  aria-sort={ariaSort}
                  className={`whitespace-nowrap px-3 py-2 font-medium ${align === 'right' ? 'text-right' : ''}`}
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded px-1 py-1 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-600"
                    onClick={() => onSort(sortField)}
                  >
                    {label}
                    <span
                      aria-hidden="true"
                      className={isActive ? 'text-sky-700' : 'text-slate-400'}
                    >
                      {isActive ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={taskRowKey(task)} className="border-t border-slate-200 align-top">
              <td className="min-w-72 px-3 py-3">
                <div className="font-medium text-slate-900">{task.title}</div>
                <div className="mt-1 max-w-xl whitespace-pre-line text-xs leading-5 text-slate-500">
                  {htmlTagsToNewlines(task.description)}
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-3">{task.category}</td>
              <td className="whitespace-nowrap px-3 py-3">{task.status}</td>
              <td className="min-w-48 px-3 py-3">{task.propertyName}</td>
              <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                {formatDate(task.createdAt)}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                {formatDate(task.dueDate)}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-right">{formatCost(task.costNok)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
