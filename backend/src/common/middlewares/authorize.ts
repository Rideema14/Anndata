import type { Request, Response, NextFunction } from 'express';
import type { Role } from '@prisma/client';
import ApiError from '../utils/ApiError';

/**
 * Role guard, equivalent to Spring Security's @PreAuthorize role checks.
 * Must run after `authenticate`. Usage: router.post('/x', authenticate, authorize('ADMIN'), handler)
 */
function authorize(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action.'));
    }
    next();
  };
}

export default authorize;
