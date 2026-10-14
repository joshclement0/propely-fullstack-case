import type { PublicTask } from '@propely-case/contracts';
import type { TaskRecord } from './db/schema.js';

/** Removes storage-only fields and formats a task for the public API. */
export function toPublicTask(task: TaskRecord): PublicTask {
  return {
    title: task.title,
    description: task.description,
    category: task.category,
    status: task.status,
    propertyName: task.property_name,
    createdAt: task.created_at,
    dueDate: task.due_date,
    costNok: task.cost_nok,
  };
}
