export interface RequestErrorEntry {
  event: 'http_request_error';
  method: string;
  path: string;
  statusCode: number;
  errorName: string;
  message: string;
  stack?: string;
}

interface RequestErrorLogInput {
  error: unknown;
  method: string;
  path: string;
  statusCode: number;
}

interface RequestErrorLogOptions {
  log?: (entry: string) => void;
}

/** Logs safe request metadata and preserves stack details for unexpected server failures. */
export function writeRequestErrorLog(
  { error, method, path, statusCode }: RequestErrorLogInput,
  { log = console.error }: RequestErrorLogOptions = {},
): void {
  const entry: RequestErrorEntry = {
    event: 'http_request_error',
    method,
    path,
    statusCode,
    errorName: error instanceof Error ? error.constructor.name : 'UnknownError',
    message: error instanceof Error ? error.message : 'Unknown request error.',
    ...(statusCode >= 500 && error instanceof Error && error.stack ? { stack: error.stack } : {}),
  };

  log(JSON.stringify(entry));
}
