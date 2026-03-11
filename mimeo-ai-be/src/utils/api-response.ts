import { Response } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({ success: true, data });
}

export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, 201);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta
): void {
  res.status(200).json({ success: true, data, meta });
}

export function sendError(res: Response, statusCode: number, message: string): void {
  res.status(statusCode).json({ success: false, error: message });
}
