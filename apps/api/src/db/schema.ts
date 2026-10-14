import { TASK_CATEGORIES, TASK_STATUSES } from '@propely-case/contracts';
import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const properties = sqliteTable(
  'properties',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
  },
  (table) => [index('properties_name_idx').on(sql`${table.name} COLLATE NOCASE`)],
);

export const tasks = sqliteTable(
  'tasks',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    category: text('category', { enum: TASK_CATEGORIES }).notNull(),
    status: text('status', { enum: TASK_STATUSES }).notNull(),
    pagination_key: text('pagination_key').notNull(),
    property_id: text('property_id')
      .notNull()
      .references(() => properties.id),
    created_at: text('created_at').notNull(),
    due_date: text('due_date'),
    cost_nok: integer('cost_nok'),
  },
  (table) => [
    uniqueIndex('tasks_pagination_key_idx').on(table.pagination_key),
    index('tasks_created_cursor_idx').on(
      sql`${table.created_at} DESC`,
      sql`${table.pagination_key} ASC`,
    ),
    index('tasks_status_created_cursor_idx').on(
      table.status,
      sql`${table.created_at} DESC`,
      sql`${table.pagination_key} ASC`,
    ),
    index('tasks_category_created_cursor_idx').on(
      table.category,
      sql`${table.created_at} DESC`,
      sql`${table.pagination_key} ASC`,
    ),
    index('tasks_property_created_cursor_idx').on(
      table.property_id,
      sql`${table.created_at} DESC`,
      sql`${table.pagination_key} ASC`,
    ),
  ],
);

/** Internal joined task model. Storage identifiers must stay behind the HTTP boundary. */
export type TaskRecord = typeof tasks.$inferSelect & {
  property_name: (typeof properties.$inferSelect)['name'];
};
