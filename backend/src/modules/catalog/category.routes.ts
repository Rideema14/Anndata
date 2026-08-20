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
 *     description: Returns all active categories. Admin users also see inactive categories. Each category includes its nested sub-categories.
 *     security: []
 *     responses:
 *       200:
 *         description: Array of categories with sub-categories.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Category'
 */
router.get('/', optionalAuthenticate, controller.list);

/**
 * @openapi
 * /categories/{slug}:
 *   get:
 *     tags: [Catalog]
 *     summary: Get a single category by slug
 *     description: Returns the category matching the given slug, along with its sub-categories.
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The URL-friendly slug of the category.
 *         example: seeds
 *     responses:
 *       200:
 *         description: Category with sub-categories.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found.
 */
router.get('/:slug', validate({ params: slugParamSchema }), controller.getOne);

/**
 * @openapi
 * /categories:
 *   post:
 *     tags: [Catalog]
 *     summary: Create a new category (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 80
 *                 example: Seeds
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: High-quality agricultural seeds
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Category created.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Only admins can create categories.
 *       409:
 *         description: Category name already exists.
 */
router.post('/', authenticate, authorize('ADMIN'), validate({ body: categorySchema }), controller.create);

/**
 * @openapi
 * /categories/{id}:
 *   patch:
 *     tags: [Catalog]
 *     summary: Update a category (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 80
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Category updated.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Only admins can update categories.
 *       404:
 *         description: Category not found.
 */
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParamSchema, body: categorySchema.partial() }),
  controller.update
);

/**
 * @openapi
 * /categories/{id}/image:
 *   post:
 *     tags: [Catalog]
 *     summary: Upload/replace a category image (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Category image file (JPEG, PNG, WebP).
 *     responses:
 *       200:
 *         description: Category image updated.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Category'
 *       400:
 *         description: No image file uploaded.
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Only admins can upload category images.
 *       404:
 *         description: Category not found.
 */
router.post(
  '/:id/image',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParamSchema }),
  uploadImage.single('image'),
  controller.uploadImage
);

/**
 * @openapi
 * /categories/{id}:
 *   delete:
 *     tags: [Catalog]
 *     summary: Delete a category (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Category deleted.
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Only admins can delete categories.
 *       404:
 *         description: Category not found.
 */
router.delete('/:id', authenticate, authorize('ADMIN'), validate({ params: idParamSchema }), controller.remove);

/**
 * @openapi
 * /categories/subcategories:
 *   post:
 *     tags: [Catalog]
 *     summary: Create a sub-category (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryId, name]
 *             properties:
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 description: Parent category ID.
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 80
 *                 example: Hybrid Seeds
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Sub-category created.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Only admins can create sub-categories.
 *       404:
 *         description: Parent category not found.
 */
router.post(
  '/subcategories',
  authenticate,
  authorize('ADMIN'),
  validate({ body: subCategorySchema }),
  controller.createSubCategory
);

/**
 * @openapi
 * /categories/subcategories/{id}:
 *   patch:
 *     tags: [Catalog]
 *     summary: Update a sub-category (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 80
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Sub-category updated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Only admins can update sub-categories.
 *       404:
 *         description: Sub-category not found.
 */
router.patch(
  '/subcategories/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParamSchema, body: subCategorySchema.partial() }),
  controller.updateSubCategory
);

/**
 * @openapi
 * /categories/subcategories/{id}:
 *   delete:
 *     tags: [Catalog]
 *     summary: Delete a sub-category (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Sub-category deleted.
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Only admins can delete sub-categories.
 *       404:
 *         description: Sub-category not found.
 */
router.delete(
  '/subcategories/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParamSchema }),
  controller.removeSubCategory
);

export default router;
