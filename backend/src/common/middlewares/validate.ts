import type { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import ApiError from '../utils/ApiError';

export interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Validates req.body / req.query / req.params against Zod schemas and
 * replaces them with the parsed (and type-coerced) result.
 * Usage: router.post('/x', validate({ body: createProductSchema }), handler)
 *
 * req.query/req.params are cast on assignment — Express types them as
 * ParsedQs/ParamsDictionary (string-keyed), which a coerced Zod result
 * (numbers, booleans, etc.) won't structurally match even though it's the
 * correct runtime value.
 */
function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query) as typeof req.query;
      if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
        return next(ApiError.badRequest('Validation failed.', details));
      }
      next(err);
    }
  };
}

export default validate;
