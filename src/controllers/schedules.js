import { AppError } from "../lib/AppError.js";
import { getSchedulesByTripId } from "../models/schedule.js";

export async function getSchedulesForTrip(req, res) {
    try {
        const { id } = req.params;
        // TODO: FIND a way to validate the trip id
        // filtered schedules
        const schedules = await getSchedulesByTripId(id);
        if (schedules.length === 0) throw new AppError("No schedules found", 404)
        // return a message and the schedules as array
        return res.status(200).json({
            message: "retrieve a list of schedules according to the tripId provided",
            schedules
        })
    } catch (err) {
        // catch if the error is our custom error
        if (err instanceof AppError) return res.status(err.statusCode).json({ message: err.message });
        return res.status(500).json({ message: "Internal server error" })
    }
}

export async function getSchedulesForTripAndMonth(req, res) {
    try {
        const { id } = req.params;
        const month = req.query.month; // TODO: possible breaks, review

        const schedules = await getSchedulesByTripId(id, month);
        if (schedules.length === 0) throw new AppError("No schedules found", 404)
        return res.status(200).json({
            message: "retrieve a list of schedules according to the tripId provided",
            schedules
        })
    } catch (err) {
        if (err instanceof AppError) return res.status(err.statusCode).json({ message: err.message });
        return res.status(500).json({ message: "Internal server error" })
    }
}