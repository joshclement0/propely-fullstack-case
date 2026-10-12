import cors from 'cors';
import express from 'express';
import { databaseNeedsSeed, DB_PATH, loadSeedData, openDatabase } from './db.js';
import { createTaskRepository } from './task-repository.js';
import { createTaskService } from './task-service.js';

const PORT = Number(process.env.PORT ?? 8080);

const needsSeed = databaseNeedsSeed();
const repository = createTaskRepository(openDatabase());
const taskService = createTaskService(repository);

if (needsSeed) {
  const seedData = loadSeedData();
  taskService.initialize(seedData);
  console.log(
    `Built ${DB_PATH} from seed (${seedData.properties.length} properties, ${seedData.tasks.length} tasks).`,
  );
}

const app = express();

app.use(cors());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/tasks', (_req, res) => {
  try {
    res.json(taskService.listTasks());
  } catch (error) {
    console.error('Failed to list tasks.', error);
    res.status(500).json({ error: 'Could not load tasks.' });
  }
});

app.listen(PORT, () => {
  console.log(`API listening at http://localhost:${PORT}`);
});
