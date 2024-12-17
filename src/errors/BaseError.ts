export class BaseError extends Error {
  public readonly name: string;
  public readonly isOperational: boolean;
  public readonly statusCode: number;
  public readonly meta?: Record<string, any>;

  constructor(
    name: string, 
    message: string, 
    statusCode: number = 500, 
    isOperational: boolean = true,
    meta?: Record<string, any>
  ) {
    super(message);
    
    Object.setPrototypeOf(this, new.target.prototype);
    
    this.name = name;
    this.isOperational = isOperational;
    this.statusCode = statusCode;
    this.meta = meta;

    Error.captureStackTrace(this);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      meta: this.meta,
      stack: this.stack
    };
  }
}
