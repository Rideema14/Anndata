import { Router } from 'express';
import { z } from 'zod';
import * as profileController from './profile.controller';
import * as addressController from './address.controller';
import * as authController from './auth.controller';
import validate from '../../common/middlewares/validate';
import { authenticate } from '../../common/middlewares/authenticate';
import { uploadImage } from '../../common/middlewares/upload';
import { updateProfileSchema, addressSchema } from './auth.validation';

const router = Router();

const idParamSchema = z.object({ id: z.string().uuid('Invalid id') });

router.use(authenticate); // every route below requires a logged-in user

/**
 * @openapi
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get the current user's profile
 *     description: Returns the sanitized profile for the authenticated user including name, email, phone, location, and profile image.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile object.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Missing or invalid access token.
 */
router.get('/me', authController.me);

/**
 * @openapi
 * /users/me:
 *   patch:
 *     tags: [Users]
 *     summary: Update name, phone, or geo-location on the current user's profile
 *     description: Partially updates the user's profile. Only the supplied fields are changed.
 *     security:
 *       - bearerAuth: []
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
 *                 maxLength: 100
 *                 example: Ravi Kumar
 *               phone:
 *                 type: string
 *                 pattern: '^\+?[0-9]{10,15}$'
 *                 example: '+919876543210'
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 example: 28.6139
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 example: 77.209
 *     responses:
 *       200:
 *         description: Profile updated.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Missing or invalid access token.
 */
router.patch('/me', validate({ body: updateProfileSchema }), profileController.updateProfile);

/**
 * @openapi
 * /users/me/image:
 *   post:
 *     tags: [Users]
 *     summary: Upload/replace the current user's profile image
 *     description: Accepts a single image via multipart form-data (field name `image`). The image is uploaded to Cloudinary and the URL is saved on the user record.
 *     security:
 *       - bearerAuth: []
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
 *                 description: The profile image file (JPEG, PNG, WebP).
 *     responses:
 *       200:
 *         description: Profile image updated.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: No image file uploaded.
 *       401:
 *         description: Missing or invalid access token.
 */
router.post('/me/image', uploadImage.single('image'), profileController.uploadProfileImage);

/**
 * @openapi
 * /users/me/login-history:
 *   get:
 *     tags: [Users]
 *     summary: Paginated login history for the current user
 *     description: Returns a paginated list of login-history entries (IP, user-agent, success/failure, timestamp) for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page.
 *     responses:
 *       200:
 *         description: Paginated login history entries.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         description: Missing or invalid access token.
 */
router.get('/me/login-history', profileController.loginHistory);

// --- Address book ---------------------------------------------------------

/**
 * @openapi
 * /users/me/addresses:
 *   get:
 *     tags: [Addresses]
 *     summary: List all addresses for the current user
 *     description: Returns all saved addresses for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of address objects.
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
 *                         $ref: '#/components/schemas/Address'
 *       401:
 *         description: Missing or invalid access token.
 */
router.get('/me/addresses', addressController.list);

/**
 * @openapi
 * /users/me/addresses:
 *   post:
 *     tags: [Addresses]
 *     summary: Add a new address
 *     description: Creates a new address in the user's address book. If `isDefault` is true, any existing default address is un-flagged.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddressInput'
 *     responses:
 *       201:
 *         description: Address added.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Address'
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Missing or invalid access token.
 */
router.post('/me/addresses', validate({ body: addressSchema }), addressController.create);

/**
 * @openapi
 * /users/me/addresses/{id}:
 *   get:
 *     tags: [Addresses]
 *     summary: Get a single address by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Address ID.
 *     responses:
 *       200:
 *         description: Address object.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Address'
 *       401:
 *         description: Missing or invalid access token.
 *       404:
 *         description: Address not found or does not belong to this user.
 */
router.get('/me/addresses/:id', validate({ params: idParamSchema }), addressController.getOne);

/**
 * @openapi
 * /users/me/addresses/{id}:
 *   patch:
 *     tags: [Addresses]
 *     summary: Update an address
 *     description: Partially updates an existing address. Only supplied fields are changed.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Address ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddressInput'
 *     responses:
 *       200:
 *         description: Address updated.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Address'
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Missing or invalid access token.
 *       404:
 *         description: Address not found or does not belong to this user.
 */
router.patch(
  '/me/addresses/:id',
  validate({ params: idParamSchema, body: addressSchema.partial() }),
  addressController.update
);

/**
 * @openapi
 * /users/me/addresses/{id}:
 *   delete:
 *     tags: [Addresses]
 *     summary: Delete an address
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Address ID.
 *     responses:
 *       204:
 *         description: Address deleted.
 *       401:
 *         description: Missing or invalid access token.
 *       404:
 *         description: Address not found or does not belong to this user.
 */
router.delete('/me/addresses/:id', validate({ params: idParamSchema }), addressController.remove);

export default router;
