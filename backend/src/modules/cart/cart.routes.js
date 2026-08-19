const router = require('express').Router();
const { z } = require('zod');
const cartService = require('./cart.service');
const ApiResponse = require('../../common/utils/ApiResponse');
const asyncHandler = require('../../common/middlewares/asyncHandler');
const validate = require('../../common/middlewares/validate');
const { authenticate } = require('../../common/middlewares/authenticate');
const { addItemSchema, updateItemSchema } = require('./cart.validation');

const itemIdParamSchema = z.object({ itemId: z.string().uuid() });

router.use(authenticate);

/**
 * @openapi
 * /cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get the current user's cart with computed line totals
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const cart = await cartService.getOrCreateCart(req.user.id);
    ApiResponse.ok(res, cart);
  })
);

router.post(
  '/items',
  validate({ body: addItemSchema }),
  asyncHandler(async (req, res) => {
    const cart = await cartService.addItem(req.user.id, req.body);
    ApiResponse.created(res, cart, 'Item added to cart.');
  })
);

router.patch(
  '/items/:itemId',
  validate({ params: itemIdParamSchema, body: updateItemSchema }),
  asyncHandler(async (req, res) => {
    const cart = await cartService.updateItemQuantity(req.user.id, req.params.itemId, req.body.quantity);
    ApiResponse.ok(res, cart, 'Cart updated.');
  })
);

router.delete(
  '/items/:itemId',
  validate({ params: itemIdParamSchema }),
  asyncHandler(async (req, res) => {
    const cart = await cartService.removeItem(req.user.id, req.params.itemId);
    ApiResponse.ok(res, cart, 'Item removed.');
  })
);

router.delete(
  '/',
  asyncHandler(async (req, res) => {
    const cart = await cartService.clearCart(req.user.id);
    ApiResponse.ok(res, cart, 'Cart cleared.');
  })
);

module.exports = router;
