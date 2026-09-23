import { getDb } from '../db/connect.js';
import { AppError } from '../lib/AppError.js';
import Schedule from './schemas/schedule.js'


export async function getSchedulesByTripId(tripId, month = null) {
    const db = await getDb()
    // TODO: Add a checker if there is month passed in to this function
    if (month) {
        const schedForSpecMonth = await db.collection('trips').aggregate([
            { $match: { id: tripId, operatingMonths: month } },
            {
                $lookup: {
                    from: "schedules",
                    pipeline: [
                        { $match: { tripId } }
                    ],
                    as: 'schedules'
                }
            }
        ]).toArray();
        if (schedForSpecMonth.length === 0) throw new AppError("No schedule available for this trip this month", 404);
        return schedForSpecMonth[0];
    }
    // this should return an Array
    const def = await db.collection('trips').aggregate([
        { $match: { id: tripId } },
        {
            $lookup: {
                from: 'schedules',
                pipeline: [
                    { $match: { tripId } }
                ],
                as: 'schedules'
            }
        }
    ]).toArray();
    return def[0]
}


