import { Router } from "express";
import {
  getAllTrips,
  getTripById,
  createTrip
} from "../controllers/trips.js";
import { scheduleController } from "../controllers/schedule.js";


import Trip from "../models/schemas/trips.js";
import mongoose from "mongoose";


// Auth Middlewares
import { requirePageLogin, requireApiRole } from "../middleware/auth.js"
import { adminDashboardPage, adminUsers, adminDeleteUser, adminUpdateUser } from "../controllers/admin.js";


const router = Router();

/**
 * @swagger
 * /api/trips:
 *   get:
 *     summary: Get a page of scenic train trips
 *     tags: [Trips]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: One-based page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: Maximum number of trips in the response
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *         description: Exact case-insensitive region filter
 *       - in: query
 *         name: season
 *         schema:
 *           type: string
 *         description: Exact case-insensitive best-season filter
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive substring search in trip names and descriptions
 *     responses:
 *       200:
 *         description: A page of trips with pagination metadata and filter options
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TripPage'
 *       400:
 *         description: Invalid page, limit, or filter parameter type
 *       500:
 *         description: Failed to fetch trips
 */
router.get("/api/trips", getAllTrips);

/**
 * @swagger
 * /api/trips/{id}:
 *   get:
 *     summary: Get a scenic train trip by ID
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The trip identifier
 *     responses:
 *       200:
 *         description: The requested trip
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trip'
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Failed to fetch trip
 */
router.get("/api/trips/:id", getTripById);

/**
 * @swagger
 * components:
 *   schemas:
 *     TripPage:
 *       type: object
 *       required:
 *         - trips
 *         - pagination
 *         - filterOptions
 *       properties:
 *         trips:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Trip'
 *         pagination:
 *           type: object
 *           required: [page, limit, totalItems, totalPages]
 *           properties:
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             totalItems:
 *               type: integer
 *             totalPages:
 *               type: integer
 *         filterOptions:
 *           type: object
 *           required: [regions, seasons]
 *           properties:
 *             regions:
 *               type: array
 *               items:
 *                 type: string
 *             seasons:
 *               type: array
 *               items:
 *                 type: string
 *     Trip:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - description
 *         - region
 *         - startStation
 *         - endStation
 *         - duration
 *         - distance
 *         - highlights
 *         - bestSeason
 *         - operatingMonths
 *         - imageUrl
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         region:
 *           type: string
 *         startStation:
 *           type: string
 *         endStation:
 *           type: string
 *         duration:
 *           type: string
 *         distance:
 *           type: number
 *         highlights:
 *           type: array
 *           items:
 *             type: string
 *         bestSeason:
 *           type: string
 *         operatingMonths:
 *           type: array
 *           items:
 *             type: integer
 *         imageUrl:
 *           type: string
 */

/**
 * @swagger
 * /api/trips/{id}/schedules:
 *    get:
 *      summary: gets a list of schedules on a specific trip
 *      tags: [Schedules]
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: the tripId
 *        - in: query
 *          name: month
 *          required: false
 *          schema:
 *            type: integer
 *          description: provided a number of month (e.g December = 12)
 *      responses:
 *         200: 
 *            description: returned a list of schedules for specific trip and month
 */

router.get("/api/trips/:id/schedules", scheduleController)

/**
 * @swagger
 * /api/trips:
 *   post:
 *     summary: Create a trip (admin only)
 *     tags: [Trips]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Trip'
 *     responses:
 *       201:
 *         description: The created trip
 *       400:
 *         description: Invalid trip data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin role required
 *       409:
 *         description: A trip with this id already exists
 */
router.post("/api/trips", requireApiRole("admin"), createTrip);


// TODO: Add admin routes for user management swagger docs

router.get("/api/admin/users", requirePageLogin(), requireApiRole("admin"), adminUsers)

router.delete("/api/admin/users/:id", requirePageLogin(), requireApiRole("admin"), adminDeleteUser);

router.put("/api/admin/users/:id", requirePageLogin(), requireApiRole("admin"), adminUpdateUser);


// DEBUGS
router.get('/api/debug-trips', async (req, res) => {
  const raw = await mongoose.connection.db.collection('trips').find({}).toArray();
  console.log('raw count:', raw.length);
  console.log('raw sample:', raw[0]);

  const trips = await Trip.find({});
  console.log('Trip.find count:', trips.length);

  return res.json({ rawCount: raw.length, modelCount: trips.length });
});
export default router;