import cors from 'cors';
import express from 'express';
import { databaseNeedsSeed, DB_PATH, loadSeedData } from './db.js';
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
    const tasks = listTasks(query);
    res.json(tasks.map(toPublicTask));
  } catch (error) {
    if (error instanceof TaskListQueryValidationError) {
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
