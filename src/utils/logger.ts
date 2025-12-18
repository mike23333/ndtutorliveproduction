// Environment-based logging utility
// Suppresses debug/info logs in production to reduce noise

const isDev = import.meta.env.DEV;

function formatMessage(prefix: string, ...args: unknown[]): unknown[] {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
  return [`[${timestamp}][${prefix}]`, ...args];
}

export const logger = {
  /**
   * Debug logging - only outputs in development
   */
  debug: (prefix: string, ...args: unknown[]) => {
    if (isDev) {
      console.debug(...formatMessage(prefix, ...args));
    }
  },

  /**
   * Info logging - only outputs in development
   */
  info: (prefix: string, ...args: unknown[]) => {
    if (isDev) {
      console.log(...formatMessage(prefix, ...args));
    }
  },

  /**
   * Warning logging - outputs in all environments
   */
  warn: (prefix: string, ...args: unknown[]) => {
    console.warn(...formatMessage(prefix, ...args));
  },

  /**
   * Error logging - outputs in all environments
   */
  error: (prefix: string, ...args: unknown[]) => {
    console.error(...formatMessage(prefix, ...args));
  },
};

export default logger;
