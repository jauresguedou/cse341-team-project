import { Router } from "express";
import {
  getAllTrips,
  getTripById,
} from "../controllers/trips.js";
import { scheduleController } from "../controllers/schedule.js";


import Trip from "../models/schemas/trips.js";
import mongoose from "mongoose";


const router = Router();

/**
 * @swagger
 * /api/trips:
 *   get:
 *     summary: Get all scenic train trips
 *     tags: [Trips]
 *     responses:
 *       200:
 *         description: A list of trips
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Trip'
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