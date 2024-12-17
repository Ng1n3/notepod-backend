import { BaseError } from "./BaseError";

export class ValidationError extends BaseError {
  constructor(message: string = 'Validation failed', meta?: Record<string, any>) {
    super(
      'ValidationError', 
      message, 
      400, 
      true, 
      meta
    );
  }
}