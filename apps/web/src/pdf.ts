import type { PublicTask } from '@propely-case/contracts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { TASK_FIELD_LABELS, type TaskField } from './task-fields';
import { formatCost, formatDate } from './TaskTable';
import { htmlTagsToNewlines } from './text';

export interface TasksPdfOptions {
  visibleFields: TaskField[];
  activeFilters: string[];
}

const pdfCell = (task: PublicTask, field: TaskField): string => {
  switch (field) {
    case 'title':
      return `${task.title}\n${htmlTagsToNewlines(task.description)}`;
    case 'category':
      return task.category;
    case 'status':
      return task.status;
    case 'propertyName':
      return task.propertyName;
    case 'createdAt':
      return formatDate(task.createdAt);
    case 'dueDate':
      return formatDate(task.dueDate);
    case 'costNok':
      return formatCost(task.costNok);
  }
};

export function createTasksPdf(tasks: PublicTask[], options: TasksPdfOptions): jsPDF {
  const document = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  document.setFontSize(16);
  document.text('Vedlikeholdsoppgaver', 14, 15);
  document.setFontSize(9);
  document.text(`Eksportert ${new Intl.DateTimeFormat('nb-NO').format(new Date())}`, 14, 21);
  const filterText = options.activeFilters.length
    ? `Aktive filtre: ${options.activeFilters.join(' | ')}`
    : 'Aktive filtre: Ingen';
  const filterLines = document.splitTextToSize(filterText, 268) as string[];
  document.text(filterLines, 14, 26);
  const startY = 28 + filterLines.length * 4;

  autoTable(document, {
    startY,
    head: [options.visibleFields.map((field) => TASK_FIELD_LABELS[field])],
    body: tasks.map((task) => options.visibleFields.map((field) => pdfCell(task, field))),
    styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak', minCellWidth: 5 },
    headStyles: { fillColor: [15, 23, 42] },
  });

  return document;
}

export function downloadTasksPdf(tasks: PublicTask[], options: TasksPdfOptions): void {
  createTasksPdf(tasks, options).save(
    `vedlikeholdsoppgaver-${new Date().toISOString().slice(0, 10)}.pdf`,
  );
}
