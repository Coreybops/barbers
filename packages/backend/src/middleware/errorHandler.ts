import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

interface ErrorResponse {
  error: string;
  details?: any;
  stack?: string;
}

export const errorHandler = (
  err: Error | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: any = undefined;

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        statusCode = 400;
        message = 'Unique constraint violation';
        details = { field: err.meta?.target };
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Foreign key constraint violation';
        break;
      case 'P2014':
        statusCode = 400;
        message = 'Invalid ID';
        break;
      default:
        statusCode = 400;
        message = 'Database error';
        break;
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    details = err.message;
  }

  const response: ErrorResponse = {
    error: message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};