import { Router } from 'express';
import { z } from 'zod';
import * as landVisitController from './landVisit.controller';
import validate from '../../common/middlewares/validate';
import { authenticate } from '../../common/middlewares/authenticate';
import { updateVisitStatusSchema, listVisitRequestsQuerySchema } from './land.validation';

const router = Router();

const idParamSchema = z.object({ id: z.string().uuid() });

// Must be registered before the bare '/land' mount in routes/index.ts — same
// rule as '/seeds/*' and '/machinery/*': Express matches mount prefixes in
// registration order, and '/land' alone would otherwise swallow
// '/land/visit-requests' as if "visit-requests" were a listing slug.

/**
 * @openapi
 * /land/visit-requests/my:
 *   get:
 *     tags: [Land]
 *     summary: The authenticated buyer's own land visit requests
 */
router.get('/my', authenticate, validate({ query: listVisitRequestsQuerySchema }), landVisitController.myVisitRequests);

router.get('/:id', authenticate, validate({ params: idParamSchema }), landVisitController.getOne);

/**
 * @openapi
 * /land/visit-requests/{id}/status:
 *   patch:
 *     tags: [Land]
 *     summary: Seller accepts/rejects/completes a visit request; buyer may cancel their own
 */
router.patch(
  '/:id/status',
  authenticate,
  validate({ params: idParamSchema, body: updateVisitStatusSchema }),
  landVisitController.updateStatus
);

export default router;
