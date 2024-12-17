import { BaseError } from './BaseError';

export class AuthenticationError extends BaseError {
  constructor(
    message: string = 'Authentication failed',
    meta?: Record<string, any>
  ) {
    super('AuthenticationError', message, 401, true, meta);
  }
}
