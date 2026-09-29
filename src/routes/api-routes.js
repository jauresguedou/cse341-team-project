import { Router } from "express";
import {
  getAllTrips,
  getTripById,
} from "../controllers/trips.js";

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
 *     responses:
 *       200:
 *         description: A page of trips with pagination metadata and filter options
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TripPage'
 *       400:
 *         description: Invalid page or limit
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

export default router;