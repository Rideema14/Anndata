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
const controller = __importStar(require("./machineryAnalytics.controller"));
const validate_1 = __importDefault(require("../../common/middlewares/validate"));
const authenticate_1 = require("../../common/middlewares/authenticate");
const authorize_1 = __importDefault(require("../../common/middlewares/authorize"));
const machinery_validation_1 = require("./machinery.validation");
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'));
/**
 * @openapi
 * /machinery/analytics/dashboard:
 *   get:
 *     tags: [Machinery]
 *     summary: Active listings, bookings to fulfill, currently-active rentals, and revenue snapshot for the current seller
 */
router.get('/dashboard', controller.getDashboard);
/**
 * @openapi
 * /machinery/analytics/overview:
 *   get:
 *     tags: [Machinery]
 *     summary: Booking trend, top machinery, status breakdown, and fleet utilization rate for the current seller
 */
router.get('/overview', (0, validate_1.default)({ query: machinery_validation_1.machineryAnalyticsQuerySchema }), controller.getAnalytics);
/**
 * @openapi
 * /machinery/analytics/calendar:
 *   get:
 *     tags: [Machinery]
 *     summary: Booking blocks (machine, quantity, date range) for a period — data shaped for a calendar/timeline UI, not a literal Google Calendar sync
 */
router.get('/calendar', (0, validate_1.default)({ query: machinery_validation_1.calendarQuerySchema }), controller.getCalendar);
exports.default = router;
//# sourceMappingURL=machineryAnalytics.routes.js.map