import { Router } from 'express';
import { z } from 'zod';
import * as landController from './land.controller';
import * as landVisitController from './landVisit.controller';
import validate from '../../common/middlewares/validate';
import { authenticate, optionalAuthenticate } from '../../common/middlewares/authenticate';
import authorize from '../../common/middlewares/authorize';
import { uploadImage } from '../../common/middlewares/upload';
import {
  landCreateSchema,
  landUpdateSchema,
  landQuerySchema,
  myListingsQuerySchema,
  createVisitRequestSchema,
  listVisitRequestsQuerySchema,
} from './land.validation';

const router = Router();

const idParamSchema = z.object({ id: z.string().uuid() });
const slugParamSchema = z.object({ slug: z.string().trim().min(1) });
const imageParamSchema = z.object({ id: z.string().uuid(), imageId: z.string().uuid() });

/**
 * @openapi
 * /land:
 *   get:
 *     tags: [Land]
 *     summary: Search/filter/paginate land listings (deal type, price, area, city/state)
 */
router.get('/', validate({ query: landQuerySchema }), landController.list);

// Must be registered before '/:slug' — otherwise Express would treat
// "my-listings" as a slug and route it into the getOne handler.
router.get(
  '/my-listings',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ query: myListingsQuerySchema }),
  landController.myListings
);

router.get('/:slug', validate({ params: slugParamSchema }), optionalAuthenticate, landController.getOne);

router.post(
  '/',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ body: landCreateSchema }),
  landController.create
);

router.patch(
  '/:id',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: idParamSchema, body: landUpdateSchema }),
  landController.update
);

router.delete('/:id', authenticate, authorize('SELLER', 'ADMIN'), validate({ params: idParamSchema }), landController.remove);

router.post(
  '/:id/images',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: idParamSchema }),
  uploadImage.array('images', 8),
  landController.addImages
);

router.delete(
  '/:id/images/:imageId',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: imageParamSchema }),
  landController.removeImage
);

// --- Visit requests (nested under a listing) --------------------------

/**
 * @openapi
 * /land/{id}/visit-requests:
 *   post:
 *     tags: [Land]
 *     summary: Buyer requests a site visit for this listing (date, time, message)
 */
router.post(
  '/:id/visit-requests',
  authenticate,
  validate({ params: idParamSchema, body: createVisitRequestSchema }),
  landVisitController.create
);

router.get(
  '/:id/visit-requests',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: idParamSchema, query: listVisitRequestsQuerySchema }),
  landVisitController.listForLand
);

export default router;
