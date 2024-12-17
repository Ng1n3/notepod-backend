import { BaseError } from "./BaseError";

export class DatabaseError extends BaseError {
  constructor(message: string = 'Database operation failed', meta?: Record<string, any>) {
    super(
      'DatabaseError', 
      message, 
      500, 
      false, 
      meta
    );
  }
}