const winston = require('winston');
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize } = format;

// Custom format for logs
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let meta = '';
  if (Object.keys(metadata).length > 0) {
    meta = `\n\tMetadata: ${JSON.stringify(metadata, null, 2)}`;
  }
  return `${timestamp} ${level}: ${message}${meta}`;
});

// Create the logger
const logger = createLogger({
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
  transports: [
    // Console transport for development
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
    }),

    // File transport with rotation
    new transports.File({
      filename: 'app.log',
      maxsize: 5242880, // 5MB in bytes
      maxFiles: 5, // Keep up to 5 rotated files
      tailable: true, // The newest will always be the one being written to
      // format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
    }),

    new transports.File({
      filename: 'error.log',
      level: 'error',
      maxFiles: 5,
      maxsize: 5242880,
      tailable: true,
    }),
  ],
});

const logRequest = (resolver, args, context) => {
  logger.info(`GraphQL Request: ${resolver}`, {
    resolver,
    args,
    userId: context.session?.userId,
    userEmail: context.session?.email,
  });
};

const logError = (resolver, error, context) => {
  logger.error(`Error in ${resolver}`, {
    resolver,
    error: error.message,
    stack: error.stack,
    userId: context.session?.userId,
    errorType: error.constructor.name,
  });
};

// Export the logger
module.exports = { logger, logRequest, logError };
