export const TASK_FIELDS = [
  'title',
  'category',
  'status',
  'propertyName',
  'createdAt',
  'dueDate',
  'costNok',
] as const;

export type TaskField = (typeof TASK_FIELDS)[number];

export const TASK_FIELD_LABELS: Record<TaskField, string> = {
  title: 'Oppgave',
  category: 'Kategori',
  status: 'Status',
  propertyName: 'Eiendom',
  createdAt: 'Opprettet',
  dueDate: 'Frist',
  costNok: 'Kostnad',
};
