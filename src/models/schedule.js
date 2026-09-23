import Schedule from "./schemas/schedule.js";
import Trip from "./schemas/trips.js";

export async function getSchedulesByTripId(tripId, month = null) {
    try {
        if (month) {
            const schedules = await Schedule.aggregate([
                { $match: { tripId } },
                {
                    $lookup: {
                        from: 'trips',
                        pipeline: [
                            {
                                $match: { id: tripId, operatingMonths: month }
                            }
                        ],
                        as: 'trips'
                    }
                }
            ])
            if (schedules[0].trips.length < 0) return []
            return schedules;
        }
        const schedules = await Schedule.aggregate([
            { $match: { tripId } }
        ])
        console.log(schedules)
        return schedules;
    } catch (err) {
        console.error({ ...err })
        return []
    }
}