const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');

const { env } = require('./config/env');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const { apiLimiter } = require('./common/middlewares/rateLimiters');
const notFound = require('./common/middlewares/notFound');
const errorHandler = require('./common/middlewares/errorHandler');
const logger = require('./common/utils/logger');

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(compression());
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// The `verify` hook stashes the raw request bytes on req.rawBody as JSON
// parsing happens — needed because the Razorpay webhook signature is computed
// over the exact raw payload, not a re-serialized copy of the parsed object.
app.use(
  express.json({
    limit: '2mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(env.apiPrefix, apiLimiter, routes);

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Agri Marketplace API', docs: '/api-docs' });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
