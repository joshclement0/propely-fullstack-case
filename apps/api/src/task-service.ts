import type { TaskRecord } from './schema.js';
import {
  initializeTaskRepository,
  listTasks as listTaskRecords,
  type TaskRepositoryQuery,
} from './task-repository.js';
import type { SeedData } from './types.js';

export function initializeTasks(seedData: SeedData): void {
  initializeTaskRepository(seedData);
}

export function listTasks(query: TaskRepositoryQuery = {}): TaskRecord[] {
  return listTaskRecords(query);
}
