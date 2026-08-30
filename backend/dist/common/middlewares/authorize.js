"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ApiError_1 = __importDefault(require("../utils/ApiError"));
/**
 * Role guard, equivalent to Spring Security's @PreAuthorize role checks.
 * Must run after `authenticate`. Usage: router.post('/x', authenticate, authorize('ADMIN'), handler)
 */
function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return next(ApiError_1.default.unauthorized('Authentication required.'));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(ApiError_1.default.forbidden('You do not have permission to perform this action.'));
        }
        next();
    };
}
exports.default = authorize;
//# sourceMappingURL=authorize.js.map