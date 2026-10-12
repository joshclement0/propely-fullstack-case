import { TASK_CATEGORIES, TASK_STATUSES } from '@propely-case/contracts';
import Joi from 'joi';
import type { SeedData, SeedProperty, SeedTask } from './types.js';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

/** Converts parsed, unknown JSON values into the service's seed contract. */
export function createSeedData(tasks: unknown, properties: unknown): SeedData {
  return {
    tasks: validate(tasksSchema, tasks, 'tasks seed'),
    properties: validate(propertiesSchema, properties, 'properties seed'),
  };
}
