import { TASK_CATEGORIES, TASK_STATUSES } from '@propely-case/contracts';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const properties = sqliteTable('properties', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
});

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category', { enum: TASK_CATEGORIES }).notNull(),
  status: text('status', { enum: TASK_STATUSES }).notNull(),
  property_id: text('property_id')
    .notNull()
    .references(() => properties.id),
  created_at: text('created_at').notNull(),
  due_date: text('due_date'),
  cost_nok: integer('cost_nok'),
});

/** Internal joined task model. Storage identifiers must stay behind the HTTP boundary. */
export type TaskRecord = typeof tasks.$inferSelect & {
  property_name: (typeof properties.$inferSelect)['name'];
};
