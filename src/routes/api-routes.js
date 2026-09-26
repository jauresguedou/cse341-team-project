import { Router } from 'express';
import { getAllBookingsHandler } from '../controllers/bookings.js';

const router = Router();

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get all bookings
 *     tags:
 *       - Bookings
 *     responses:
 *       200:
 *         description: A list of all bookings
 *       500:
 *         description: Failed to retrieve bookings
 */
router.get('/bookings', getAllBookingsHandler);

export default router;