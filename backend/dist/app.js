"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const env_1 = require("./config/env");
const swagger_1 = __importDefault(require("./config/swagger"));
const routes_1 = __importDefault(require("./routes"));
const rateLimiters_1 = require("./common/middlewares/rateLimiters");
const notFound_1 = __importDefault(require("./common/middlewares/notFound"));
const errorHandler_1 = __importDefault(require("./common/middlewares/errorHandler"));
const logger_1 = __importDefault(require("./common/utils/logger"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: env_1.env.clientUrl, credentials: true }));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)(env_1.env.nodeEnv === 'development' ? 'dev' : 'combined', { stream: { write: (msg) => logger_1.default.info(msg.trim()) } }));
// The `verify` hook stashes the raw request bytes on req.rawBody as JSON
// parsing happens — needed because the Razorpay webhook signature is computed
// over the exact raw payload, not a re-serialized copy of the parsed object.
app.use(express_1.default.json({
    limit: '2mb',
    verify: (req, res, buf) => {
        req.rawBody = buf;
    },
}));
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default));
app.use(env_1.env.apiPrefix, rateLimiters_1.apiLimiter, routes_1.default);
app.get('/', (req, res) => {
    res.json({ success: true, message: 'Agri Marketplace API', docs: '/api-docs' });
});
app.use(notFound_1.default);
app.use(errorHandler_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map