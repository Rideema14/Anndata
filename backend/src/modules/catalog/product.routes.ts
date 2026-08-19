import { Router } from 'express';
import { z } from 'zod';
import * as productController from './product.controller';
import * as reviewController from './review.controller';
import validate from '../../common/middlewares/validate';
import { authenticate, optionalAuthenticate } from '../../common/middlewares/authenticate';
import authorize from '../../common/middlewares/authorize';
import { uploadImage } from '../../common/middlewares/upload';
import {
  productCreateSchema,
  productUpdateSchema,
  productQuerySchema,
  nearbyQuerySchema,
  topDealsQuerySchema,
  variantInputSchema,
  reviewSchema,
} from './catalog.validation';

const router = Router();

const idParamSchema = z.object({ id: z.string().uuid() });
const slugParamSchema = z.object({ slug: z.string().trim().min(1) });
const imageParamSchema = z.object({ id: z.string().uuid(), imageId: z.string().uuid() });
const variantParamSchema = z.object({ id: z.string().uuid(), variantId: z.string().uuid() });
const reviewIdParamSchema = z.object({ id: z.string().uuid(), reviewId: z.string().uuid() });
const approvalBodySchema = z.object({ isApproved: z.boolean() });

/**
 * @openapi
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: Search/filter/paginate the product catalog
 *     description: Returns a paginated, filterable list of active products. Supports full-text search, category/sub-category filtering, price range, seller filtering, and multiple sort modes.
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         description: Page number (default 1).
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *         description: Items per page (default 20).
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Full-text search term matched against product name, description, brand.
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category slug.
 *       - in: query
 *         name: subCategory
 *         schema:
 *           type: string
 *         description: Filter by sub-category slug.
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter.
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter.
 *       - in: query
 *         name: sellerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter products by seller ID.
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, price_asc, price_desc, rating, popular]
 *           default: newest
 *         description: Sort order.
 *     responses:
 *       200:
 *         description: Paginated product list.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', validate({ query: productQuerySchema }), productController.list);

/**
 * @openapi
 * /products/nearby:
 *   get:
 *     tags: [Products]
 *     summary: Find products near a geo-location
 *     description: Returns products within `radiusKm` of the supplied latitude/longitude, ordered by distance.
 *     security: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *         description: Latitude of the search center.
 *         example: 28.6139
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *         description: Longitude of the search center.
 *         example: 77.209
 *       - in: query
 *         name: radiusKm
 *         schema:
 *           type: number
 *           default: 25
 *           maximum: 500
 *         description: Search radius in kilometres (default 25).
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *         description: Maximum number of results.
 *     responses:
 *       200:
 *         description: Array of nearby products.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Missing or invalid lat/lng.
 */
router.get('/nearby', validate({ query: nearbyQuerySchema }), productController.nearby);

/**
 * @openapi
 * /products/top-deals:
 *   get:
 *     tags: [Products]
 *     summary: Get top discounted products
 *     description: Returns products with the highest discount percentage (discountPrice vs price).
 *     security: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *         description: Maximum number of results.
 *     responses:
 *       200:
 *         description: Array of top deal products.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/top-deals', validate({ query: topDealsQuerySchema }), productController.topDeals);

/**
 * @openapi
 * /products/{slug}:
 *   get:
 *     tags: [Products]
 *     summary: Get a single product by slug
 *     description: Returns full product details including images, variants, category, seller info, and reviews. Increments the view counter. If authenticated, includes the user's wishlist status.
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Product slug.
 *         example: hybrid-wheat-seeds-5kg
 *     responses:
 *       200:
 *         description: Full product object.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found.
 */
router.get('/:slug', validate({ params: slugParamSchema }), optionalAuthenticate, productController.getOne);

/**
 * @openapi
 * /products:
 *   post:
 *     tags: [Products]
 *     summary: Create a new product (Seller / Admin)
 *     description: Creates a new product listing. The seller is automatically set to the authenticated user. Optionally include inline variants.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryId, name, price]
 *             properties:
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               subCategoryId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *                 example: Organic Wheat Seeds 5kg
 *               description:
 *                 type: string
 *                 maxLength: 5000
 *               brand:
 *                 type: string
 *                 maxLength: 100
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 exclusiveMinimum: true
 *                 example: 450
 *               discountPrice:
 *                 type: number
 *                 minimum: 0
 *                 exclusiveMinimum: true
 *                 example: 399
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *               unit:
 *                 type: string
 *                 maxLength: 30
 *                 default: piece
 *                 example: bag
 *               specifications:
 *                 type: object
 *                 additionalProperties: true
 *                 description: Flexible key-value pairs for category-specific attributes.
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *               variants:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/VariantInput'
 *     responses:
 *       201:
 *         description: Product created.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Only sellers and admins can create products.
 */
router.post(
  '/',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ body: productCreateSchema }),
  productController.create
);

/**
 * @openapi
 * /products/{id}:
 *   patch:
 *     tags: [Products]
 *     summary: Update a product (Seller owner / Admin)
 *     description: Partially updates an existing product. Only the product owner (seller) or an admin can perform this action.
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
 *               subCategoryId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               brand:
 *                 type: string
 *               price:
 *                 type: number
 *               discountPrice:
 *                 type: number
 *               stock:
 *                 type: integer
 *               unit:
 *                 type: string
 *               specifications:
 *                 type: object
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Product updated.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Not the owner of this product.
 *       404:
 *         description: Product not found.
 */
router.patch(
  '/:id',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: idParamSchema, body: productUpdateSchema }),
  productController.update
);

/**
 * @openapi
 * /products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product (Seller owner / Admin)
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
 *         description: Product deleted.
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Not the owner of this product.
 *       404:
 *         description: Product not found.
 */
router.delete(
  '/:id',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: idParamSchema }),
  productController.remove
);

/**
 * @openapi
 * /products/{id}/images:
 *   post:
 *     tags: [Products]
 *     summary: Upload product images (Seller owner / Admin)
 *     description: Upload up to 8 images at once via multipart form-data (field name `images`). Images are stored in Cloudinary.
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
 *             required: [images]
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 8
 *                 description: Product image files (JPEG, PNG, WebP).
 *     responses:
 *       201:
 *         description: Images uploaded.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: No image files uploaded.
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Not the owner of this product.
 *       404:
 *         description: Product not found.
 */
router.post(
  '/:id/images',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: idParamSchema }),
  uploadImage.array('images', 8),
  productController.addImages
);

/**
 * @openapi
 * /products/{id}/images/{imageId}:
 *   delete:
 *     tags: [Products]
 *     summary: Remove a product image (Seller owner / Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID.
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product image ID.
 *     responses:
 *       204:
 *         description: Image removed.
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Not the owner of this product.
 *       404:
 *         description: Product or image not found.
 */
router.delete(
  '/:id/images/:imageId',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: imageParamSchema }),
  productController.removeImage
);

/**
 * @openapi
 * /products/{id}/variants:
 *   post:
 *     tags: [Products]
 *     summary: Add a variant to a product (Seller owner / Admin)
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
 *             $ref: '#/components/schemas/VariantInput'
 *     responses:
 *       201:
 *         description: Variant added.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Not the owner of this product.
 *       404:
 *         description: Product not found.
 */
router.post(
  '/:id/variants',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: idParamSchema, body: variantInputSchema }),
  productController.addVariant
);

/**
 * @openapi
 * /products/{id}/variants/{variantId}:
 *   patch:
 *     tags: [Products]
 *     summary: Update a product variant (Seller owner / Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID.
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Variant ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               sku:
 *                 type: string
 *                 maxLength: 60
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *               attributes:
 *                 type: object
 *     responses:
 *       200:
 *         description: Variant updated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Not the owner of this product.
 *       404:
 *         description: Product or variant not found.
 */
router.patch(
  '/:id/variants/:variantId',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: variantParamSchema, body: variantInputSchema.partial() }),
  productController.updateVariant
);

/**
 * @openapi
 * /products/{id}/variants/{variantId}:
 *   delete:
 *     tags: [Products]
 *     summary: Remove a product variant (Seller owner / Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID.
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Variant ID.
 *     responses:
 *       204:
 *         description: Variant removed.
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Not the owner of this product.
 *       404:
 *         description: Product or variant not found.
 */
router.delete(
  '/:id/variants/:variantId',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: variantParamSchema }),
  productController.removeVariant
);

// --- Reviews (nested under a product) --------------------------------------

/**
 * @openapi
 * /products/{id}/reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: List reviews for a product
 *     description: Returns paginated, approved reviews for a product.
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID.
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated reviews.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       404:
 *         description: Product not found.
 */
router.get('/:id/reviews', validate({ params: idParamSchema }), reviewController.list);

/**
 * @openapi
 * /products/{id}/reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Post a review for a product
 *     description: Creates a review for the given product. Each user may only review a product once.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating]
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               comment:
 *                 type: string
 *                 maxLength: 1000
 *                 example: Great quality seeds with high germination rate.
 *     responses:
 *       201:
 *         description: Review posted.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Missing or invalid access token.
 *       409:
 *         description: User has already reviewed this product.
 */
router.post(
  '/:id/reviews',
  authenticate,
  validate({ params: idParamSchema, body: reviewSchema }),
  reviewController.create
);

/**
 * @openapi
 * /products/{id}/reviews/{reviewId}:
 *   patch:
 *     tags: [Reviews]
 *     summary: Update your review
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID.
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Review ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Review updated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Not the author of this review.
 *       404:
 *         description: Review not found.
 */
router.patch(
  '/:id/reviews/:reviewId',
  authenticate,
  validate({ params: reviewIdParamSchema, body: reviewSchema.partial() }),
  reviewController.update
);

/**
 * @openapi
 * /products/{id}/reviews/{reviewId}:
 *   delete:
 *     tags: [Reviews]
 *     summary: Delete a review (author or Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID.
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Review ID.
 *     responses:
 *       204:
 *         description: Review deleted.
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Not the author of this review (unless Admin).
 *       404:
 *         description: Review not found.
 */
router.delete(
  '/:id/reviews/:reviewId',
  authenticate,
  validate({ params: reviewIdParamSchema }),
  reviewController.remove
);

/**
 * @openapi
 * /products/{id}/reviews/{reviewId}/approval:
 *   patch:
 *     tags: [Reviews]
 *     summary: Approve or reject a review (Admin only)
 *     description: Sets the `isApproved` flag on a review. Unapproved reviews are hidden from the public listing.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID.
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Review ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isApproved]
 *             properties:
 *               isApproved:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Review moderation updated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Only admins can moderate reviews.
 *       404:
 *         description: Review not found.
 */
router.patch(
  '/:id/reviews/:reviewId/approval',
  authenticate,
  authorize('ADMIN'),
  validate({ params: reviewIdParamSchema, body: approvalBodySchema }),
  reviewController.setApproval
);

export default router;
