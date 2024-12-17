import { GraphQLError } from 'graphql';
import { BaseError } from './BaseError';

export class ErrorHandler {
  static handleError(error: Error): GraphQLError {
    // Log the error (you can use a logging service here)
    console.error('Unhandled Error:', error);

    if (error instanceof BaseError) {
      return new GraphQLError(error.message, {
        extensions: {
          code: error.name,
          statusCode: error.statusCode,
          isOperational: error.isOperational,
          meta: error.meta
        }
      });
    }

    // Handle unexpected errors
    return new GraphQLError('Internal Server Error', {
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
        isOperational: false
      }
    });
  }
}