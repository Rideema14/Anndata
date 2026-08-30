"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
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
function validate(schemas) {
    return (req, res, next) => {
        try {
            if (schemas.body)
                req.body = schemas.body.parse(req.body);
            if (schemas.query)
                req.query = schemas.query.parse(req.query);
            if (schemas.params)
                req.params = schemas.params.parse(req.params);
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                const details = err.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
                return next(ApiError_1.default.badRequest('Validation failed.', details));
            }
            next(err);
        }
    };
}
exports.default = validate;
//# sourceMappingURL=validate.js.map