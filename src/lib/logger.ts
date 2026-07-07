/**
 * Minimal structured logger — no dependencies, edge/runtime safe.
 *
 * Emits one JSON object per line in production (easy to ingest by Vercel log
 * drains / Sentry / Datadog) and a compact human line in development. Level is
 * controlled by `LOG_LEVEL` (debug|info|warn|error), defaulting to `info` in
 * production and `debug` otherwise. Use instead of bare console.* in new code:
 *
 *   import { logger } from '@/lib/logger';
 *   logger.info('sync.start', { connectionId });
 *   logger.error('sync.failed', { connectionId, error: String(err) });
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function threshold(): number {
  const env = (process.env.LOG_LEVEL || '').toLowerCase() as Level;
  if (env in ORDER) return ORDER[env];
  return process.env.NODE_ENV === 'production' ? ORDER.info : ORDER.debug;
}

type Meta = Record<string, unknown>;

function emit(level: Level, event: string, meta?: Meta): void {
  if (ORDER[level] < threshold()) return;
  const record = { level, event, time: new Date().toISOString(), ...meta };
  const sink = level === 'error' || level === 'warn' ? console.error : console.log;
  if (process.env.NODE_ENV === 'production') {
    sink(JSON.stringify(record));
  } else {
    const extra = meta && Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    sink(`[${level}] ${event}${extra}`);
  }
}

export const logger = {
  debug: (event: string, meta?: Meta) => emit('debug', event, meta),
  info: (event: string, meta?: Meta) => emit('info', event, meta),
  warn: (event: string, meta?: Meta) => emit('warn', event, meta),
  error: (event: string, meta?: Meta) => emit('error', event, meta),
};
