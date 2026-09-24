import { Response } from 'express';
import { ApiResponse } from '../types';

export function sendSuccess<T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200,
  meta?: ApiResponse['meta']
) {
  const payload: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  errors?: any
) {
  const payload: ApiResponse = {
    success: false,
    message,
    errors
  };
  return res.status(statusCode).json(payload);
}
