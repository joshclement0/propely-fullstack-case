import type { RequestHandler } from 'express';
import { performance } from 'node:perf_hooks';

export interface RequestTimingEntry {
  event: 'http_request';
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  aborted: boolean;
}

interface RequestTimingOptions {
  log?: (entry: RequestTimingEntry) => void;
  now?: () => number;
}

const writeTimingLog = (entry: RequestTimingEntry): void => {
  console.info(JSON.stringify(entry));
};

/** Records one structured timing entry when an HTTP response completes or aborts. */
export function createRequestTimingMiddleware({
  log = writeTimingLog,
  now = () => performance.now(),
}: RequestTimingOptions = {}): RequestHandler {
  return (req, res, next) => {
    const startedAt = now();
    let recorded = false;

    const record = (aborted: boolean): void => {
      if (recorded) return;
      recorded = true;

      log({
        event: 'http_request',
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Number((now() - startedAt).toFixed(2)),
        aborted,
      });
    };

    res.once('finish', () => record(false));
    res.once('close', () => {
      if (!res.writableFinished) record(true);
    });

    next();
  };
}
