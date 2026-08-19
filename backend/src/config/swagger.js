const swaggerJsdoc = require('swagger-jsdoc');
const { env } = require('./env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Agri Marketplace API',
      version: '1.0.0',
      description:
        'Backend API for the multi-category agricultural marketplace platform. ' +
        'Phase 1: Auth, Catalog, Cart, Orders, Payments (Razorpay).',
    },
    servers: [{ url: `http://localhost:${env.port}${env.apiPrefix}` }],
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
  apis: ['./src/modules/**/*.routes.js'],
};

module.exports = swaggerJsdoc(options);
