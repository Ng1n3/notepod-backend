import { ZodIssue } from 'zod';
import { BaseError } from './BaseError';

export class ValidationError extends BaseError {
  constructor(
    message: string = 'Validation failed',
    meta?: { validationErrors?: ZodIssue[] }
  ) {
    super('ValidationError', message, 400, true, meta || {});
  }
}
