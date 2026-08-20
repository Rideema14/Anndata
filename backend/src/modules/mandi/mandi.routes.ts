import { Router } from 'express';
import { z } from 'zod';
import * as controller from './mandi.controller';
import validate from '../../common/middlewares/validate';
import { authenticate } from '../../common/middlewares/authenticate';
import authorize from '../../common/middlewares/authorize';
import {
  mandiSchema,
  cropSchema,
  mandiListQuerySchema,
  districtsQuerySchema,
  priceEntrySchema,
  bulkPriceEntrySchema,
  priceQuerySchema,
  priceHistoryQuerySchema,
  alertSchema,
} from './mandi.validation';

const router = Router();

const idParamSchema = z.object({ id: z.string().uuid() });
const mandiIdParamSchema = z.object({ mandiId: z.string().uuid() });

// --- Cascading location filters (public) ------------------------------------

/**
 * @openapi
 * /mandi/states:
 *   get:
 *     tags: [Mandi]
 *     summary: List states that have at least one active mandi
 */
router.get('/states', controller.listStates);

router.get('/districts', validate({ query: districtsQuerySchema }), controller.listDistricts);

// --- Markets (mandis) --------------------------------------------------

router.get('/markets', validate({ query: mandiListQuerySchema }), controller.listMandis);
router.get('/markets/:id', validate({ params: idParamSchema }), controller.getMandi);
router.post('/markets', authenticate, authorize('ADMIN'), validate({ body: mandiSchema }), controller.createMandi);
router.patch(
  '/markets/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParamSchema, body: mandiSchema.partial() }),
  controller.updateMandi
);
router.delete('/markets/:id', authenticate, authorize('ADMIN'), validate({ params: idParamSchema }), controller.deleteMandi);

// --- Crops -----------------------------------------------------------------

router.get('/crops', controller.listCrops);
router.post('/crops', authenticate, authorize('ADMIN'), validate({ body: cropSchema }), controller.createCrop);
router.patch(
  '/crops/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParamSchema, body: cropSchema.partial() }),
  controller.updateCrop
);
router.delete('/crops/:id', authenticate, authorize('ADMIN'), validate({ params: idParamSchema }), controller.deleteCrop);

// --- Prices ------------------------------------------------------------

/**
 * @openapi
 * /mandi/prices:
 *   get:
 *     tags: [Mandi]
 *     summary: Query price records, filterable by state/district/mandi/crop/date range
 */
router.get('/prices', validate({ query: priceQuerySchema }), controller.listPrices);

router.post('/prices', authenticate, authorize('ADMIN'), validate({ body: priceEntrySchema }), controller.createPrice);

router.post(
  '/prices/bulk',
  authenticate,
  authorize('ADMIN'),
  validate({ body: bulkPriceEntrySchema }),
  controller.bulkCreatePrices
);

/**
 * @openapi
 * /mandi/prices/history:
 *   get:
 *     tags: [Mandi]
 *     summary: Ordered price time series for a crop-mandi pair, for charting
 */
router.get('/prices/history', validate({ query: priceHistoryQuerySchema }), controller.getPriceHistory);

// --- External sync (optional, admin-triggered) ------------------------------

router.get('/sync/status', authenticate, authorize('ADMIN'), controller.syncStatus);
router.post('/sync', authenticate, authorize('ADMIN'), controller.syncPrices);

// --- Favorite mandis (personal) ---------------------------------------------

router.get('/favorites', authenticate, controller.listFavorites);
router.post('/favorites/:mandiId', authenticate, validate({ params: mandiIdParamSchema }), controller.addFavorite);
router.delete('/favorites/:mandiId', authenticate, validate({ params: mandiIdParamSchema }), controller.removeFavorite);

// --- Price alerts (personal) ------------------------------------------------

router.get('/alerts', authenticate, controller.listAlerts);
router.post('/alerts', authenticate, validate({ body: alertSchema }), controller.createAlert);
router.patch(
  '/alerts/:id',
  authenticate,
  validate({ params: idParamSchema, body: alertSchema.partial() }),
  controller.updateAlert
);
router.delete('/alerts/:id', authenticate, validate({ params: idParamSchema }), controller.deleteAlert);

export default router;
