import { Router } from 'express';
import * as controller from './weather.controller';
import validate from '../../common/middlewares/validate';
import { weatherQuerySchema } from './weather.validation';

const router = Router();

/**
 * @openapi
 * /weather:
 *   get:
 *     tags: [Weather]
 *     summary: Current weather + up to 16-day forecast for a location (DB-cached; public, no auth required)
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *       - in: query
 *         name: lng
 *         required: true
 *       - in: query
 *         name: days
 *         required: false
 */
router.get('/', validate({ query: weatherQuerySchema }), controller.getWeather);

export default router;
