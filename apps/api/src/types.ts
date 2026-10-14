import type { TaskCategory, TaskStatus } from '@propely-case/contracts';

/** A single task, exactly as stored in SQLite. */
export interface SeedTask {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
  property_id: string;
  /** ISO 8601 date, e.g. "2024-03-11". */
  created_at: string;
  /** ISO 8601 date, or null. */
  due_date: string | null;
  cost_nok: number | null;
}

/** A property that tasks belong to, as stored in SQLite. */
export interface SeedProperty {
  id: string;
  name: string;
}

export interface SeedData {
  tasks: SeedTask[];
  properties: SeedProperty[];
}
