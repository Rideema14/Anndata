import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import swaggerSpec from './config/swagger';
import routes from './routes';
import { apiLimiter } from './common/middlewares/rateLimiters';
import notFound from './common/middlewares/notFound';
import errorHandler from './common/middlewares/errorHandler';
import logger from './common/utils/logger';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(compression());
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined', { stream: { write: (msg: string) => logger.info(msg.trim()) } }));

// The `verify` hook stashes the raw request bytes on req.rawBody as JSON
// parsing happens — needed because the Razorpay webhook signature is computed
// over the exact raw payload, not a re-serialized copy of the parsed object.
app.use(
  express.json({
    limit: '2mb',
    verify: (req, res, buf) => {
      (req as express.Request).rawBody = buf;
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

export default app;
