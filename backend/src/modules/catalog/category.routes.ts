import { Router } from 'express';
import { z } from 'zod';
import * as controller from './category.controller';
import validate from '../../common/middlewares/validate';
import { authenticate, optionalAuthenticate } from '../../common/middlewares/authenticate';
import authorize from '../../common/middlewares/authorize';
import { uploadImage } from '../../common/middlewares/upload';
import { categorySchema, subCategorySchema } from './catalog.validation';

const router = Router();

const idParamSchema = z.object({ id: z.string().uuid() });
const slugParamSchema = z.object({ slug: z.string().trim().min(1) });

/**
 * @openapi
 * /categories:
 *   get:
 *     tags: [Catalog]
 *     summary: List all active categories with their sub-categories
 */
router.get('/', optionalAuthenticate, controller.list);

router.get('/:slug', validate({ params: slugParamSchema }), controller.getOne);

router.post('/', authenticate, authorize('ADMIN'), validate({ body: categorySchema }), controller.create);

router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParamSchema, body: categorySchema.partial() }),
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

router.post(
  '/subcategories',
  authenticate,
  authorize('ADMIN'),
  validate({ body: subCategorySchema }),
  controller.createSubCategory
);

router.patch(
  '/subcategories/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParamSchema, body: subCategorySchema.partial() }),
  controller.updateSubCategory
);

router.delete(
  '/subcategories/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParamSchema }),
  controller.removeSubCategory
);

export default router;
