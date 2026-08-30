"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const profileController = __importStar(require("./profile.controller"));
const addressController = __importStar(require("./address.controller"));
const authController = __importStar(require("./auth.controller"));
const validate_1 = __importDefault(require("../../common/middlewares/validate"));
const authenticate_1 = require("../../common/middlewares/authenticate");
const upload_1 = require("../../common/middlewares/upload");
const auth_validation_1 = require("./auth.validation");
const router = (0, express_1.Router)();
const idParamSchema = zod_1.z.object({ id: zod_1.z.string().uuid('Invalid id') });
router.use(authenticate_1.authenticate); // every route below requires a logged-in user
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
router.patch('/me', (0, validate_1.default)({ body: auth_validation_1.updateProfileSchema }), profileController.updateProfile);
/**
 * @openapi
 * /users/me/image:
 *   post:
 *     tags: [Users]
 *     summary: Upload/replace the current user's profile image (multipart field "image")
 */
router.post('/me/image', upload_1.uploadImage.single('image'), profileController.uploadProfileImage);
/**
 * @openapi
 * /users/me/image:
 *   delete:
 *     tags: [Users]
 *     summary: Remove the current user's profile image entirely (also deletes it from Cloudinary)
 */
router.delete('/me/image', profileController.removeProfileImage);
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
router.post('/me/addresses', (0, validate_1.default)({ body: auth_validation_1.addressSchema }), addressController.create);
router.get('/me/addresses/:id', (0, validate_1.default)({ params: idParamSchema }), addressController.getOne);
router.patch('/me/addresses/:id', (0, validate_1.default)({ params: idParamSchema, body: auth_validation_1.addressSchema.partial() }), addressController.update);
router.delete('/me/addresses/:id', (0, validate_1.default)({ params: idParamSchema }), addressController.remove);
exports.default = router;
//# sourceMappingURL=profile.routes.js.map