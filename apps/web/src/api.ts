import { isPublicTaskList, type PublicTask } from '@propely-case/contracts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

// Tasks change rarely, so we only hit the API once per session.
let cache: PublicTask[] | null = null;

export async function fetchTasks(): Promise<PublicTask[]> {
  if (cache) return cache;

  const response = await fetch(`${API_BASE_URL}/api/tasks`);
  if (!response.ok) {
    throw new Error(`Task request failed with status ${response.status}.`);
  }

  const result: unknown = await response.json();
  if (!isPublicTaskList(result)) {
    throw new Error('Task response did not match the public contract.');
  }

  cache = result;

  return cache;
}
