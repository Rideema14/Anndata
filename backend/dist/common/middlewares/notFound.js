"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = notFound;
const ApiError_1 = __importDefault(require("../utils/ApiError"));
function notFound(req, res, next) {
    next(ApiError_1.default.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
//# sourceMappingURL=notFound.js.map