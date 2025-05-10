/**
 * Simple logger utility for the application
 */

// Log levels
const LOG_LEVEL = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Current log level from environment or default to INFO
const currentLogLevel = process.env.LOG_LEVEL ? 
  Number(process.env.LOG_LEVEL) : LOG_LEVEL.INFO;

/**
 * Format log message with timestamp
 */
const formatMessage = (message: string, data?: any): string => {
  const timestamp = new Date().toISOString();
  let formattedMessage = `[${timestamp}] ${message}`;
  
  if (data) {
    // Handle circular references in objects
    try {
      const safeData = typeof data === 'object' ? 
        JSON.stringify(data, null, 2) : 
        data;
      formattedMessage += `\nData: ${safeData}`;
    } catch (e) {
      formattedMessage += `\nData: [Complex Object]`;
    }
  }
  
  return formattedMessage;
};

/**
 * Logger object with methods for different log levels
 */
export const logger = {
  error: (message: string, data?: any) => {
    if (currentLogLevel >= LOG_LEVEL.ERROR) {
      console.error(`ERROR: ${formatMessage(message, data)}`);
    }
  },
  
  warn: (message: string, data?: any) => {
    if (currentLogLevel >= LOG_LEVEL.WARN) {
      console.warn(`WARN: ${formatMessage(message, data)}`);
    }
  },
  
  info: (message: string, data?: any) => {
    if (currentLogLevel >= LOG_LEVEL.INFO) {
      console.info(`INFO: ${formatMessage(message, data)}`);
    }
  },
  
  debug: (message: string, data?: any) => {
    if (currentLogLevel >= LOG_LEVEL.DEBUG) {
      console.debug(`DEBUG: ${formatMessage(message, data)}`);
    }
  }
};

export default logger;