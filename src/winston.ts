import winston from 'winston';
import { AuthenticationError } from './errors/AuthenticationError';
import { BaseError } from './errors/BaseError';
import { ConflictError } from './errors/ConflictError';
import { DatabaseError } from './errors/DatabaseError';
import { ValidationError } from './errors/ValidationError';
import { Mycontext } from './interfaces';
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize } = format;

type ResolverArgs = {
  [key: string]: any;
};

// Custom format for logs
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let meta = '';
  if (Object.keys(metadata).length > 0) {
    meta = `\n\tMetadata: ${JSON.stringify(metadata, null, 2)}`;
  }
  return `${timestamp} ${level}: ${message}${meta}`;
});

const excludeError = format((info) => {
  if (info.level === 'error') return false;
  return info;
});

// Create the logger
export const logger = createLogger({
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
      format: combine(excludeError(), winston.format.json()),
    }),

    new transports.File({
      filename: 'error.log',
      level: 'error',
      maxFiles: 5,
      maxsize: 5242880,
      tailable: true,
      format: winston.format.json(),
    }),
  ],
});

export const logRequest = (
  resolver: string,
  args: ResolverArgs,
  context: Mycontext
): void => {
  logger.info(`GraphQL Request: ${resolver}`, {
    resolver,
    args,
    userId: context.session?.userId,
  });
};

export const logError = (
  resolver: string,
  error:
    | BaseError
    | DatabaseError
    | ValidationError
    | ConflictError
    | AuthenticationError
    | Error,
  context: Mycontext
): void => {
  if (
    error instanceof BaseError ||
    error instanceof ValidationError ||
    error instanceof DatabaseError ||
    error instanceof ConflictError ||
    error instanceof AuthenticationError
  ) {
    logger.error(`Error in ${resolver}`, {
      resolver,
      error: error.message,
      stack: error.stack,
      userId: context.session?.userId,
      errorType: error.name,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
      meta: error.meta,
    });
  } else {
    logger.error(`Error in ${resolver}`, {
      resolver,
      error: error.message,
      stack: error.stack,
      userId: context.session?.userId,
      errorType: error.constructor.name,
    });
  }
};
