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
const controller = __importStar(require("./notification.controller"));
const validate_1 = __importDefault(require("../../common/middlewares/validate"));
const authenticate_1 = require("../../common/middlewares/authenticate");
const authorize_1 = __importDefault(require("../../common/middlewares/authorize"));
const notification_validation_1 = require("./notification.validation");
const router = (0, express_1.Router)();
const idParamSchema = zod_1.z.object({ id: zod_1.z.string().uuid() });
/**
 * @openapi
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List the current user's notifications
 */
router.get('/', authenticate_1.authenticate, (0, validate_1.default)({ query: notification_validation_1.listNotificationsQuerySchema }), controller.list);
router.get('/unread-count', authenticate_1.authenticate, controller.unreadCount);
router.patch('/:id/read', authenticate_1.authenticate, (0, validate_1.default)({ params: idParamSchema }), controller.markRead);
router.post('/read-all', authenticate_1.authenticate, controller.markAllRead);
router.get('/preferences', authenticate_1.authenticate, controller.getPreferences);
router.patch('/preferences', authenticate_1.authenticate, (0, validate_1.default)({ body: notification_validation_1.updatePreferencesSchema }), controller.updatePreferences);
// --- Feedback ----------------------------------------------------------
// Feedback can be submitted anonymously (the service accepts a null userId) —
// optionalAuthenticate attaches req.user when a token is present without
// rejecting the request when it isn't.
router.post('/feedback', authenticate_1.optionalAuthenticate, (0, validate_1.default)({ body: notification_validation_1.feedbackSchema }), controller.submitFeedback);
router.get('/feedback/mine', authenticate_1.authenticate, (0, validate_1.default)({ query: notification_validation_1.listFeedbackQuerySchema }), controller.myFeedback);
router.get('/feedback', authenticate_1.authenticate, (0, authorize_1.default)('ADMIN'), (0, validate_1.default)({ query: notification_validation_1.listFeedbackQuerySchema }), controller.listFeedback);
router.patch('/feedback/:id', authenticate_1.authenticate, (0, authorize_1.default)('ADMIN'), (0, validate_1.default)({ params: idParamSchema, body: notification_validation_1.respondFeedbackSchema }), controller.respondToFeedback);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map