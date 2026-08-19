import type { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

interface SendOptions<T> {
  statusCode?: number;
  message?: string;
  data?: T;
  meta?: { pagination: PaginationMeta } | Record<string, unknown>;
}

/**
 * Wraps every successful response in a consistent envelope:
 * { success, message, data, meta? }
 */
class ApiResponse {
  static send<T>(res: Response, { statusCode = 200, message = 'Success', data = null as T, meta }: SendOptions<T>) {
    const body: Record<string, unknown> = { success: true, message, data };
    if (meta) body.meta = meta;
    return res.status(statusCode).json(body);
  }

  static ok<T>(res: Response, data: T, message = 'Success') {
    return ApiResponse.send(res, { statusCode: 200, message, data });
  }

  static created<T>(res: Response, data: T, message = 'Created') {
    return ApiResponse.send(res, { statusCode: 201, message, data });
  }

  static paginated<T>(res: Response, items: T, pagination: PaginationMeta, message = 'Success') {
    return ApiResponse.send(res, { statusCode: 200, message, data: items, meta: { pagination } });
  }

  static noContent(res: Response) {
    return res.status(204).send();
  }
}

export default ApiResponse;
