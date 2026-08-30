"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePagination = parsePagination;
exports.buildPaginationMeta = buildPaginationMeta;
/**
 * Reads page/limit from a query object and returns Prisma skip/take plus
 * a meta block to return to the client.
 */
function parsePagination(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
    const skip = (page - 1) * limit;
    return { page, limit, skip, take: limit };
}
function buildPaginationMeta(page, limit, totalItems) {
    return {
        page,
        limit,
        totalItems,
        totalPages: Math.max(Math.ceil(totalItems / limit), 1),
    };
}
//# sourceMappingURL=pagination.js.map