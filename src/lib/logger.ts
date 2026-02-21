/**
 * Structured logging utility for the Hyrox AI Coach.
 *
 * Outputs JSON lines in production so they are machine-parseable by log
 * aggregators (Netlify, Datadog, etc.) while remaining human-readable
 * during local development.
 *
 * Every log entry includes:
 *  - `ts`      ISO-8601 timestamp
 *  - `level`   info | warn | error
 *  - `msg`     human-readable summary
 *  - `ctx`     arbitrary structured context (userId, route, latency, etc.)
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  ts: string;
  level: LogLevel;
  msg: string;
  ctx?: Record<string, unknown>;
}

const isDev = process.env.NODE_ENV === 'development';

function emit(entry: LogEntry) {
  const line = JSON.stringify(entry);
  switch (entry.level) {
    case 'error':
      console.error(line);
      break;
    case 'warn':
      console.warn(line);
      break;
    default:
      // In dev, also log a readable version for DX
      if (isDev) {
        const ctx = entry.ctx ? ` ${JSON.stringify(entry.ctx)}` : '';
        console.log(`[${entry.level.toUpperCase()}] ${entry.msg}${ctx}`);
        return;
      }
      console.log(line);
  }
}

/** Create a child logger with pre-bound context (e.g. route, userId). */
export function createLogger(baseCtx?: Record<string, unknown>) {
  function log(level: LogLevel, msg: string, ctx?: Record<string, unknown>) {
    emit({
      ts: new Date().toISOString(),
      level,
      msg,
      ctx: { ...baseCtx, ...ctx },
    });
  }

  return {
    info: (msg: string, ctx?: Record<string, unknown>) => log('info', msg, ctx),
    warn: (msg: string, ctx?: Record<string, unknown>) => log('warn', msg, ctx),
    error: (msg: string, ctx?: Record<string, unknown>) => log('error', msg, ctx),
    /** Return a child logger with additional context merged in. */
    child: (extra: Record<string, unknown>) =>
      createLogger({ ...baseCtx, ...extra }),
  };
}

/** Default root logger — import and use directly for simple cases. */
export const logger = createLogger();
