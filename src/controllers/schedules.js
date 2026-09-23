import { AppError } from "../lib/AppError.js";
import { getSchedulesByTripId } from "../models/schedule.js";
import { getDb } from "../db/connect.js";

export async function getSchedulesForTrip(req, res) {
    try {
        const { id } = req.params; 1
        const rawMonth = req.query.month;
        const month = rawMonth === undefined ? null : Number(rawMonth);
        if (month !== null && (Number.isNaN(month) || month < 1 || month > 12)) {
            throw new AppError("Invalid 'month' query parameter (expected 1-12)", 400);
        }
        const schedules = await getSchedulesByTripId(id, month);
        if (schedules.length === 0) throw new AppError("No schedules found", 404)
        // return a message and the schedules as array
        return res.status(200).json({
            message: "retrieve a list of schedules according to the tripId provided",
            schedules
        })
    } catch (err) {
        // catch if the error is our custom error
        if (err instanceof AppError) return res.status(err.statusCode).json({ message: err.message });

        return res.status(500).json({ message: "Internal server error", error: { ...err } })
    }
}
