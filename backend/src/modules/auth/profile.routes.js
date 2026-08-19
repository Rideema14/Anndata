const router = require('express').Router();
const { z } = require('zod');
const profileController = require('./profile.controller');
const addressController = require('./address.controller');
const authController = require('./auth.controller');
const validate = require('../../common/middlewares/validate');
const { authenticate } = require('../../common/middlewares/authenticate');
const { uploadImage } = require('../../common/middlewares/upload');
const { updateProfileSchema, addressSchema } = require('./auth.validation');

const idParamSchema = z.object({ id: z.string().uuid('Invalid id') });

router.use(authenticate); // every route below requires a logged-in user

/**
 * @openapi
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get the current user's profile
 */
router.get('/me', authController.me);

/**
 * @openapi
 * /users/me:
 *   patch:
 *     tags: [Users]
 *     summary: Update name, phone, or geo-location on the current user's profile
 */
router.patch('/me', validate({ body: updateProfileSchema }), profileController.updateProfile);

/**
 * @openapi
 * /users/me/image:
 *   post:
 *     tags: [Users]
 *     summary: Upload/replace the current user's profile image (multipart field "image")
 */
router.post('/me/image', uploadImage.single('image'), profileController.uploadProfileImage);

/**
 * @openapi
 * /users/me/login-history:
 *   get:
 *     tags: [Users]
 *     summary: Paginated login history for the current user
 */
router.get('/me/login-history', profileController.loginHistory);

// --- Address book ---------------------------------------------------------

router.get('/me/addresses', addressController.list);
router.post('/me/addresses', validate({ body: addressSchema }), addressController.create);
router.get('/me/addresses/:id', validate({ params: idParamSchema }), addressController.getOne);
router.patch(
  '/me/addresses/:id',
  validate({ params: idParamSchema, body: addressSchema.partial() }),
  addressController.update
);
router.delete('/me/addresses/:id', validate({ params: idParamSchema }), addressController.remove);

module.exports = router;
