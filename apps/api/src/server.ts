import { DEFAULT_TASK_PAGE_SIZE, type PublicTaskPage } from '@propely-case/contracts';
import cors from 'cors';
import express from 'express';
import { databaseNeedsSeed, DB_PATH, loadSeedData } from './db.js';
import { createTaskCursor, parseTaskCursor, TaskCursorValidationError } from './task-cursor.js';
import { parseTaskListQuery, TaskListQueryValidationError } from './task-query.js';
import { toPublicTask } from './task-response.js';
import { initializeTasks, listTasks } from './task-service.js';

const PORT = Number(process.env.PORT ?? 8080);

const needsSeed = databaseNeedsSeed();

if (needsSeed) {
  const seedData = loadSeedData();
  initializeTasks(seedData);
  console.log(
    `Built ${DB_PATH} from seed (${seedData.properties.length} properties, ${seedData.tasks.length} tasks).`,
  );
}

const app = express();

app.set('query parser', 'extended');
app.use(cors());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/tasks', (req, res) => {
  try {
    const query = parseTaskListQuery(req.query);
    const pageSize = query.pageSize ?? DEFAULT_TASK_PAGE_SIZE;
    const after = query.cursor ? parseTaskCursor(query.cursor, query) : undefined;
    const tasks = listTasks({
      filter: query.filter,
      search: query.search,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
      pageSize,
      after,
    });
    const pageTasks = tasks.slice(0, pageSize);
    const lastTask = pageTasks.at(-1);
    const response: PublicTaskPage = {
      items: pageTasks.map(toPublicTask),
      nextCursor: tasks.length > pageSize && lastTask ? createTaskCursor(lastTask, query) : null,
    };
    res.json(response);
  } catch (error) {
    if (
      error instanceof TaskListQueryValidationError ||
      error instanceof TaskCursorValidationError
    ) {
      res.status(400).json({ error: error.message });
      return;
    }

    console.error('Failed to list tasks.', error);
    res.status(500).json({ error: 'Could not load tasks.' });
  }
});

app.listen(PORT, () => {
  console.log(`API listening at http://localhost:${PORT}`);
});
