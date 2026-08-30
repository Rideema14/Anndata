"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const env_1 = require("./env");
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Agri Marketplace API',
            version: '1.0.0',
            description: 'Backend API for the multi-category agricultural marketplace platform. ' +
                'Phase 1: Auth, Catalog, Cart, Orders, Payments (Razorpay). Phase 2: Seller Management, Notifications.',
        },
        servers: [{ url: `http://localhost:${env_1.env.port}${env_1.env.apiPrefix}` }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    // JSDoc @openapi comments in route files are collected from here
    apis: ['./src/modules/**/*.routes.ts'],
};
exports.default = (0, swagger_jsdoc_1.default)(options);
//# sourceMappingURL=swagger.js.map