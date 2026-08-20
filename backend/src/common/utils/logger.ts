// Minimal structured logger. Swap this out for pino/winston later if you
// need log shipping — every call site here only depends on info/warn/error/debug,
// so the swap is a one-file change.
type Level = 'info' | 'warn' | 'error' | 'debug';

const levelColor: Record<Level, string> = {
  info: '\x1b[36m', // cyan
  warn: '\x1b[33m', // yellow
  error: '\x1b[31m', // red
  debug: '\x1b[90m', // gray
};
const reset = '\x1b[0m';

function log(level: Level, message: string, meta?: unknown) {
  const timestamp = new Date().toISOString();
  const color = levelColor[level];
  const line = `${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}`;
  const out = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  if (meta !== undefined) {
    out(line, meta);
  } else {
    out(line);
  }
}

export default {
  info: (msg: string, meta?: unknown) => log('info', msg, meta),
  warn: (msg: string, meta?: unknown) => log('warn', msg, meta),
  error: (msg: string, meta?: unknown) => log('error', msg, meta),
  debug: (msg: string, meta?: unknown) => {
    if (process.env.NODE_ENV !== 'production') log('debug', msg, meta);
  },
};
