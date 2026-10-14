import {
  TASK_CATEGORIES,
  TASK_STATUSES,
  type TaskCategory,
  type TaskStatus,
} from '@propely-case/contracts';
import Joi from 'joi';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getOrm } from './index.js';
import { properties, tasks } from './schema.js';

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

export interface SeedProperty {
  id: string;
  name: string;
}

export interface SeedData {
  tasks: SeedTask[];
  properties: SeedProperty[];
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const REPO_ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const TASKS_SEED_PATH = join(REPO_ROOT, 'seed', 'tasks.json');
const PROPERTIES_SEED_PATH = join(REPO_ROOT, 'seed', 'properties.json');

const propertySchema = Joi.object<SeedProperty>({
  id: Joi.string().min(1).required(),
  name: Joi.string().min(1).required(),
}).unknown(false);

const taskSchema = Joi.object<SeedTask>({
  id: Joi.string().min(1).required(),
  title: Joi.string().min(1).required(),
  description: Joi.string().allow('').required(),
  category: Joi.string()
    .valid(...TASK_CATEGORIES)
    .required(),
  status: Joi.string()
    .valid(...TASK_STATUSES)
    .required(),
  property_id: Joi.string().min(1).required(),
  created_at: Joi.string().pattern(ISO_DATE_PATTERN).required(),
  due_date: Joi.string().pattern(ISO_DATE_PATTERN).allow(null).required(),
  cost_nok: Joi.number().integer().min(0).allow(null).required(),
}).unknown(false);

const propertiesSchema = Joi.array<SeedProperty[]>().items(propertySchema).required();
const tasksSchema = Joi.array<SeedTask[]>().items(taskSchema).required();

const VALIDATION_OPTIONS: Joi.ValidationOptions = {
  abortEarly: false,
  allowUnknown: false,
  convert: false,
};

function validate<T>(schema: Joi.Schema<T>, value: unknown, sourceName: string): T {
  const result = schema.validate(value, VALIDATION_OPTIONS);
  if (result.error) {
    throw new Error(`Invalid ${sourceName}: ${result.error.message}`);
  }

  return result.value;
}

function readJsonFile(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** Converts parsed, unknown JSON values into the database seed contract. */
export function createSeedData(taskValues: unknown, propertyValues: unknown): SeedData {
  return {
    tasks: validate(tasksSchema, taskValues, 'tasks seed'),
    properties: validate(propertiesSchema, propertyValues, 'properties seed'),
  };
}

export function loadSeedData(): SeedData {
  for (const path of [TASKS_SEED_PATH, PROPERTIES_SEED_PATH]) {
    if (!existsSync(path)) {
      throw new Error(`Seed file not found at ${path}`);
    }
  }

  return createSeedData(readJsonFile(TASKS_SEED_PATH), readJsonFile(PROPERTIES_SEED_PATH));
}

export function seedDatabase(seedData: SeedData): void {
  getOrm().transaction((transaction) => {
    if (seedData.properties.length > 0) {
      transaction.insert(properties).values(seedData.properties).run();
    }
    if (seedData.tasks.length > 0) {
      transaction
        .insert(tasks)
        .values(
          seedData.tasks.map((task) => ({
            ...task,
            pagination_key: randomUUID(),
          })),
        )
        .run();
    }
  });
}
