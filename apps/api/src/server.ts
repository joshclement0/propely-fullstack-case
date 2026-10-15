import { isPublicTaskPage } from '@propely-case/contracts';
import cors from 'cors';
import express from 'express';
import { databaseNeedsSeed, DB_PATH } from './db/index.js';
import { loadSeedData, seedDatabase } from './db/seed.js';
import { writeRequestErrorLog } from './request-error-log.js';
import { TaskCursorValidationError } from './task-cursor.js';
import { parseTaskListQuery, TaskListQueryValidationError } from './task-query.js';
import { listTasks } from './task-service.js';
import { createRequestTimingMiddleware } from './request-timing.js';

const PORT = Number(process.env.PORT ?? 8080);

const needsSeed = databaseNeedsSeed();

if (needsSeed) {
  const seedData = loadSeedData();
  seedDatabase(seedData);
  console.log(
    `Built ${DB_PATH} from seed (${seedData.properties.length} properties, ${seedData.tasks.length} tasks).`,
  );
}

const app = express();

app.set('query parser', 'extended');
app.use(createRequestTimingMiddleware());
app.use(cors());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/tasks', (req, res) => {
  try {
    const query = parseTaskListQuery(req.query);
    const response: unknown = listTasks(query);

    if (!isPublicTaskPage(response)) {
      throw new Error('Task service returned an invalid response.');
    }

    res.json(response);
  } catch (error) {
    const isClientError =
      error instanceof TaskListQueryValidationError || error instanceof TaskCursorValidationError;
    const statusCode = isClientError ? 400 : 500;

    writeRequestErrorLog({
      error,
      method: req.method,
      path: req.path,
      statusCode,
    });

    if (isClientError) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Could not load tasks.' });
  }
});

app.listen(PORT, () => {
  console.log(`API listening at http://localhost:${PORT}`);
});
