import { Router } from 'express';
import * as controller from './machineryAnalytics.controller';
import validate from '../../common/middlewares/validate';
import { authenticate } from '../../common/middlewares/authenticate';
import authorize from '../../common/middlewares/authorize';
import { machineryAnalyticsQuerySchema, calendarQuerySchema } from './machinery.validation';

const router = Router();

router.use(authenticate, authorize('SELLER', 'ADMIN'));

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
router.get('/overview', validate({ query: machineryAnalyticsQuerySchema }), controller.getAnalytics);

/**
 * @openapi
 * /machinery/analytics/calendar:
 *   get:
 *     tags: [Machinery]
 *     summary: Booking blocks (machine, quantity, date range) for a period — data shaped for a calendar/timeline UI, not a literal Google Calendar sync
 */
router.get('/calendar', validate({ query: calendarQuerySchema }), controller.getCalendar);

export default router;
