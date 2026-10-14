import type { PublicTask } from '@propely-case/contracts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { formatCost, formatDate } from './TaskTable';
import { htmlTagsToNewlines } from './text';

export function createTasksPdf(tasks: PublicTask[]): jsPDF {
  const document = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  document.setFontSize(16);
  document.text('Vedlikeholdsoppgaver', 14, 15);
  document.setFontSize(9);
  document.text(`Eksportert ${new Intl.DateTimeFormat('nb-NO').format(new Date())}`, 14, 21);

  autoTable(document, {
    startY: 26,
    tableWidth: 244,
    head: [['Oppgave', 'Kategori', 'Status', 'Eiendom', 'Opprettet', 'Frist', 'Kostnad']],
    body: tasks.map((task) => [
      `${task.title}\n${htmlTagsToNewlines(task.description)}`,
      task.category,
      task.status,
      task.propertyName,
      formatDate(task.createdAt),
      formatDate(task.dueDate),
      formatCost(task.costNok),
    ]),
    styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak', minCellWidth: 5 },
    headStyles: { fillColor: [15, 23, 42] },
    columnStyles: {
      0: { cellWidth: 72 },
      1: { cellWidth: 24 },
      2: { cellWidth: 24 },
      3: { cellWidth: 52 },
      4: { cellWidth: 22 },
      5: { cellWidth: 22 },
      6: { cellWidth: 28, halign: 'right' },
    },
  });

  return document;
}

export function downloadTasksPdf(tasks: PublicTask[]): void {
  createTasksPdf(tasks).save(`vedlikeholdsoppgaver-${new Date().toISOString().slice(0, 10)}.pdf`);
}
