"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const levelColor = {
    info: '\x1b[36m', // cyan
    warn: '\x1b[33m', // yellow
    error: '\x1b[31m', // red
    debug: '\x1b[90m', // gray
};
const reset = '\x1b[0m';
function log(level, message, meta) {
    const timestamp = new Date().toISOString();
    const color = levelColor[level];
    const line = `${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}`;
    const out = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    if (meta !== undefined) {
        out(line, meta);
    }
    else {
        out(line);
    }
}
exports.default = {
    info: (msg, meta) => log('info', msg, meta),
    warn: (msg, meta) => log('warn', msg, meta),
    error: (msg, meta) => log('error', msg, meta),
    debug: (msg, meta) => {
        if (process.env.NODE_ENV !== 'production')
            log('debug', msg, meta);
    },
};
//# sourceMappingURL=logger.js.map