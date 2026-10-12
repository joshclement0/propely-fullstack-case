import type { PublicTask } from '@propely-case/contracts';
import { htmlTagsToNewlines } from './text';

const COLUMNS = [
  'Tittel',
  'Beskrivelse',
  'Kategori',
  'Status',
  'Eiendom',
  'Opprettet',
  'Frist',
  'Kostnad (NOK)',
] as const;

/** Renders every task in a plain table. No filtering or pagination. */
const taskRowKey = (task: PublicTask): string =>
  [task.propertyName, task.title, task.createdAt, task.description].join('\u0000');

export function TaskTable({ tasks }: { tasks: PublicTask[] }) {
  // Newest first.
  const rows = [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="overflow-x-auto rounded border border-slate-200 bg-white">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
          <tr>
            {COLUMNS.map((column) => (
              <th key={column} className="whitespace-nowrap px-3 py-2 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((task) => (
            <tr key={taskRowKey(task)} className="border-t border-slate-200 align-top">
              <td className="px-3 py-2">{task.title}</td>
              <td className="whitespace-pre-line px-3 py-2 text-slate-600">
                {htmlTagsToNewlines(task.description)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">{task.category}</td>
              <td className="whitespace-nowrap px-3 py-2">{task.status}</td>
              <td className="px-3 py-2">{task.propertyName}</td>
              <td className="whitespace-nowrap px-3 py-2 text-slate-600">{task.createdAt}</td>
              <td className="whitespace-nowrap px-3 py-2 text-slate-600">{task.dueDate ?? '—'}</td>
              <td className="whitespace-nowrap px-3 py-2 text-right">{task.costNok ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
