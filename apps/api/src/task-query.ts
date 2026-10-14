import {
  DEFAULT_TASK_PAGE_SIZE,
  MAX_TASK_PAGE_SIZE,
  TASK_CATEGORIES,
  TASK_SORT_DIRECTIONS,
  TASK_SORT_FIELDS,
  TASK_STATUSES,
  type TaskFilters,
  type TaskListQuery,
} from '@propely-case/contracts';
import Joi from 'joi';

const taskFiltersSchema = Joi.object<TaskFilters>({
  status: Joi.string().valid(...TASK_STATUSES),
  category: Joi.string().valid(...TASK_CATEGORIES),
  property_name: Joi.string().trim().min(1).max(200),
});

const taskListQuerySchema = Joi.object<TaskListQuery>({
  filter: taskFiltersSchema.optional(),
  search: Joi.string().trim().min(1).max(200).optional(),
  sortBy: Joi.string()
    .valid(...TASK_SORT_FIELDS)
    .default('createdAt'),
  sortDirection: Joi.string()
    .valid(...TASK_SORT_DIRECTIONS)
    .default('desc'),
  cursor: Joi.string().trim().min(1).max(2048).optional(),
  pageSize: Joi.number().integer().min(1).max(MAX_TASK_PAGE_SIZE).default(DEFAULT_TASK_PAGE_SIZE),
});

export class TaskListQueryValidationError extends Error {}

export function parseTaskListQuery(value: unknown): TaskListQuery {
  const result = taskListQuerySchema.validate(value, {
    abortEarly: false,
    allowUnknown: false,
    convert: true,
    stripUnknown: { objects: true },
  });

  if (result.error) {
    throw new TaskListQueryValidationError(result.error.message);
  }

  return result.value;
}
