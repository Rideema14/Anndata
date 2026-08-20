import type { PaginationMeta } from './ApiResponse';

export interface PaginationQuery {
  page?: string;
  limit?: string;
  [key: string]: unknown;
}

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

/**
 * Reads page/limit from a query object and returns Prisma skip/take plus
 * a meta block to return to the client.
 */
export function parsePagination(
  query: PaginationQuery,
  { defaultLimit = 20, maxLimit = 100 }: { defaultLimit?: number; maxLimit?: number } = {}
): ParsedPagination {
  const page = Math.max(parseInt(query.page as string, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit as string, 10) || defaultLimit, 1), maxLimit);
  const skip = (page - 1) * limit;
  return { page, limit, skip, take: limit };
}

export function buildPaginationMeta(page: number, limit: number, totalItems: number): PaginationMeta {
  return {
    page,
    limit,
    totalItems,
    totalPages: Math.max(Math.ceil(totalItems / limit), 1),
  };
}
