import type { PublicTask, TaskSortDirection, TaskSortField } from '@propely-case/contracts';

import { Button, Text } from './components';
import { TASK_FIELD_LABELS, type TaskField } from './task-fields';
import { htmlTagsToNewlines } from './text';

interface Column {
  field: TaskField;
  sortField: TaskSortField;
  align?: 'right';
}

const COLUMNS: Column[] = [
  { field: 'title', sortField: 'title' },
  { field: 'category', sortField: 'category' },
  { field: 'status', sortField: 'status' },
  { field: 'propertyName', sortField: 'propertyName' },
  { field: 'createdAt', sortField: 'createdAt' },
  { field: 'dueDate', sortField: 'dueDate' },
  { field: 'costNok', sortField: 'costNok', align: 'right' },
];

const taskRowKey = (task: PublicTask): string =>
  [task.propertyName, task.title, task.createdAt, task.description].join('\u0000');

export const formatDate = (value: string | null): string => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('nb-NO').format(new Date(`${value}T00:00:00`));
};

export const formatCost = (value: number | null): string => {
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
  visibleFields: TaskField[];
  onSort: (field: TaskSortField) => void;
}

export function TaskTable({ tasks, sortBy, sortDirection, visibleFields, onSort }: TaskTableProps) {
  const visibleColumns = COLUMNS.filter(({ field }) => visibleFields.includes(field));

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
          <tr>
            {visibleColumns.map(({ field, sortField, align }) => {
              const label = TASK_FIELD_LABELS[field];
              const isActive = sortBy === sortField;
              const ariaSort = isActive
                ? sortDirection === 'asc'
                  ? 'ascending'
                  : 'descending'
                : 'none';
              const sortIndicator = isActive ? (sortDirection === 'asc' ? '▲' : '▼') : '↕';
              const sortLabel = isActive
                ? `${label}, sortert ${sortDirection === 'asc' ? 'stigende' : 'synkende'}`
                : `${label}, ikke sortert`;

              return (
                <th
                  key={sortField}
                  aria-sort={ariaSort}
                  className={`whitespace-nowrap px-3 py-2 font-medium ${align === 'right' ? 'text-right' : ''}`}
                >
                  <Button
                    title={`${label} ${sortIndicator}`}
                    aria-label={`Sorter etter ${sortLabel}`}
                    variant="ghost"
                    className="border-0 px-1 py-1 text-xs uppercase tracking-wide hover:bg-slate-200 focus:ring-offset-0"
                    onClick={() => onSort(sortField)}
                  />
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={taskRowKey(task)} className="border-t border-slate-200 align-top">
              {visibleFields.includes('title') && (
                <td className="min-w-72 px-3 py-3">
                  <Text size="sm" weight="medium">
                    {task.title}
                  </Text>
                  <Text
                    size="xs"
                    tone="muted"
                    className="mt-1 max-w-xl whitespace-pre-line leading-5"
                  >
                    {htmlTagsToNewlines(task.description)}
                  </Text>
                </td>
              )}
              {visibleFields.includes('category') && (
                <td className="whitespace-nowrap px-3 py-3">
                  <Text size="sm">{task.category}</Text>
                </td>
              )}
              {visibleFields.includes('status') && (
                <td className="whitespace-nowrap px-3 py-3">
                  <Text size="sm">{task.status}</Text>
                </td>
              )}
              {visibleFields.includes('propertyName') && (
                <td className="min-w-48 px-3 py-3">
                  <Text size="sm">{task.propertyName}</Text>
                </td>
              )}
              {visibleFields.includes('createdAt') && (
                <td className="whitespace-nowrap px-3 py-3">
                  <Text size="sm" tone="muted">
                    {formatDate(task.createdAt)}
                  </Text>
                </td>
              )}
              {visibleFields.includes('dueDate') && (
                <td className="whitespace-nowrap px-3 py-3">
                  <Text size="sm" tone="muted">
                    {formatDate(task.dueDate)}
                  </Text>
                </td>
              )}
              {visibleFields.includes('costNok') && (
                <td className="whitespace-nowrap px-3 py-3 text-right">
                  <Text size="sm">{formatCost(task.costNok)}</Text>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
