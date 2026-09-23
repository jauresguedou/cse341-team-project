import { getSchedulesByTripId } from "../models/schedule.js";

export async function scheduleController(req, res) {
    // Route

    if (req.query.month) return getSchedulesForTripandMonth(req, res);

    return getSchedulesForTrip(req, res)
}


async function getSchedulesForTrip(req, res) {

    try {
        const { id } = req.params; // TODO: Validate the ID
        const schedules = await getSchedulesByTripId(id);
        return res.status(200).json({ schedules })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ errors: { ...err } })
    }
}

async function getSchedulesForTripandMonth(req, res) {
    const { id } = req.params;
    const rawMonthNumber = req.query.month;
    const monthNumber = Number(rawMonthNumber);

    if (!rawMonthNumber || Number.isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
        return res.status(400).json({ error: 'month must be a number between 1 and 12' });
    }
    try {
        const schedules = await getSchedulesByTripId(id, monthNumber);
        return res.status(200).json(schedules);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to retrieve schedules' });
    }
}

