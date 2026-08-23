import { Router } from 'express';
import { z } from 'zod';
import * as controller from './machineryCategory.controller';
import validate from '../../common/middlewares/validate';
import { authenticate, optionalAuthenticate } from '../../common/middlewares/authenticate';
import authorize from '../../common/middlewares/authorize';
import { uploadImage } from '../../common/middlewares/upload';
import { machineryCategorySchema } from './machinery.validation';

const router = Router();

const idParamSchema = z.object({ id: z.string().uuid() });
const slugParamSchema = z.object({ slug: z.string().trim().min(1) });

/**
 * @openapi
 * /machinery/categories:
 *   get:
 *     tags: [Machinery]
 *     summary: List all active machinery categories
 */
router.get('/', optionalAuthenticate, controller.list);

router.get('/:slug', validate({ params: slugParamSchema }), controller.getOne);

router.post('/', authenticate, authorize('ADMIN'), validate({ body: machineryCategorySchema }), controller.create);

router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParamSchema, body: machineryCategorySchema.partial() }),
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
