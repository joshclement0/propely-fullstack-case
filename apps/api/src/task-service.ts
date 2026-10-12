import type { PublicTask } from '@propely-case/contracts';
import type { SeedData } from './types.js';
import type { TaskRepository } from './task-repository.js';

export interface TaskService {
  initialize(seedData: SeedData): void;
  listTasks(): PublicTask[];
}

export function createTaskService(repository: TaskRepository): TaskService {
  return {
    initialize(seedData) {
      repository.initialize(seedData);
    },

    listTasks() {
      return repository.listTasks().map((task) => ({
        title: task.title,
        description: task.description,
        category: task.category,
        status: task.status,
        propertyName: task.property_name,
        createdAt: task.created_at,
        dueDate: task.due_date,
        costNok: task.cost_nok,
      }));
    },
  };
}
