const { ZodError } = require('zod');
const ApiError = require('../utils/ApiError');

/**
 * Validates req.body / req.query / req.params against Zod schemas and
 * replaces them with the parsed (and type-coerced) result.
 * Usage: router.post('/x', validate({ body: createProductSchema }), handler)
 * @param {{body?: import('zod').ZodSchema, query?: import('zod').ZodSchema, params?: import('zod').ZodSchema}} schemas
 */
function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      if (schemas.params) req.params = schemas.params.parse(req.params);
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

module.exports = validate;
