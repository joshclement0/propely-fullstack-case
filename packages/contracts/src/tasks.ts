export const TASK_CATEGORIES = [
  'FireSafety',
  'Plumbing',
  'Electrical',
  'Ventilation',
  'Cleaning',
  'Outdoor',
] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export const TASK_STATUSES = ['New', 'InProgress', 'Completed', 'Rejected'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

/** Public task data. Storage identifiers must never be added to this contract. */
export interface PublicTask {
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
  propertyName: string;
  createdAt: string;
  dueDate: string | null;
  costNok: number | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isTaskCategory = (value: unknown): value is TaskCategory =>
  typeof value === 'string' && TASK_CATEGORIES.some((category) => category === value);

const isTaskStatus = (value: unknown): value is TaskStatus =>
  typeof value === 'string' && TASK_STATUSES.some((status) => status === value);

const isNullableString = (value: unknown): value is string | null =>
  typeof value === 'string' || value === null;

const isNullableNumber = (value: unknown): value is number | null =>
  (typeof value === 'number' && Number.isFinite(value)) || value === null;

export function isPublicTask(value: unknown): value is PublicTask {
  return (
    isRecord(value) &&
    typeof value.title === 'string' &&
    typeof value.description === 'string' &&
    isTaskCategory(value.category) &&
    isTaskStatus(value.status) &&
    typeof value.propertyName === 'string' &&
    typeof value.createdAt === 'string' &&
    isNullableString(value.dueDate) &&
    isNullableNumber(value.costNok)
  );
}

export function isPublicTaskList(value: unknown): value is PublicTask[] {
  return Array.isArray(value) && value.every(isPublicTask);
}
