/**
 * Logger Utility
 * Provides structured, timestamped console logs for Hunarmand Pakistan
 */

const getTimestamp = () => new Date().toISOString();

const logger = {
  info: (message, meta = '') => {
    console.log(`[${getTimestamp()}] [INFO]: ${message}`, meta ? meta : '');
  },
  success: (message, meta = '') => {
    console.log(`[${getTimestamp()}] [SUCCESS]: \x1b[32m${message}\x1b[0m`, meta ? meta : '');
  },
  warn: (message, meta = '') => {
    console.warn(`[${getTimestamp()}] [WARN]: \x1b[33m${message}\x1b[0m`, meta ? meta : '');
  },
  error: (message, meta = '') => {
    console.error(`[${getTimestamp()}] [ERROR]: \x1b[31m${message}\x1b[0m`, meta ? meta : '');
  }
};

module.exports = logger;
