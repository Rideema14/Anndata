const router = require('express').Router();
const { z } = require('zod');
const controller = require('./category.controller');
const validate = require('../../common/middlewares/validate');
const { authenticate, optionalAuthenticate } = require('../../common/middlewares/authenticate');
const authorize = require('../../common/middlewares/authorize');
const { uploadImage } = require('../../common/middlewares/upload');
const { categorySchema, subCategorySchema } = require('./catalog.validation');

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

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate({ body: categorySchema }),
  controller.create
);

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

module.exports = router;
