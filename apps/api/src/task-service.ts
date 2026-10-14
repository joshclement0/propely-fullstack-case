import type { TaskListQuery } from '@propely-case/contracts';
import type { TaskRecord } from './schema.js';
import { initializeTaskRepository, listTasks as listTaskRecords } from './task-repository.js';
import type { SeedData } from './types.js';

export function initializeTasks(seedData: SeedData): void {
  initializeTaskRepository(seedData);
}

export function listTasks(query: TaskListQuery = {}): TaskRecord[] {
  return listTaskRecords(query);
}
