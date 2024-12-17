import { BaseError } from "./BaseError";

export class ConflictError extends BaseError {
  constructor(message: string = 'Conflict occurred', meta?: Record<string, any>) {
    super(
      'ConflictError', 
      message, 
      409, 
      true, 
      meta
    );
  }
}