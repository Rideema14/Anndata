import { Router } from 'express';
import { z } from 'zod';
import * as controller from './seedCategory.controller';
import validate from '../../common/middlewares/validate';
import { authenticate, optionalAuthenticate } from '../../common/middlewares/authenticate';
import authorize from '../../common/middlewares/authorize';
import { uploadImage } from '../../common/middlewares/upload';
import { seedCategorySchema } from './seed.validation';

const router = Router();

const idParamSchema = z.object({ id: z.string().uuid() });
const slugParamSchema = z.object({ slug: z.string().trim().min(1) });

/**
 * @openapi
 * /seeds/categories:
 *   get:
 *     tags: [Seed Store]
 *     summary: List all active seed categories
 */
router.get('/', optionalAuthenticate, controller.list);

router.get('/:slug', validate({ params: slugParamSchema }), controller.getOne);

router.post('/', authenticate, authorize('ADMIN'), validate({ body: seedCategorySchema }), controller.create);

router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParamSchema, body: seedCategorySchema.partial() }),
  controller.update
);

router.post(
  '/:id/image',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParamSchema }),
  uploadImage.single('image'),
  controller.uploadImage
);

router.delete('/:id', authenticate, authorize('ADMIN'), validate({ params: idParamSchema }), controller.remove);

export default router;
