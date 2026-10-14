import { isPublicTaskPage, type PublicTaskPage } from '@propely-case/contracts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export async function fetchTaskPage(cursor?: string): Promise<PublicTaskPage> {
  const url = new URL(`${API_BASE_URL}/api/tasks`);
  if (cursor) url.searchParams.set('cursor', cursor);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Task request failed with status ${response.status}.`);
  }

  const result: unknown = await response.json();
  if (!isPublicTaskPage(result)) {
    throw new Error('Task response did not match the public contract.');
  }

  return result;
}
