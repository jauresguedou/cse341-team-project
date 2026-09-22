import Schedule from './schemas/schedule.js'


export async function getSchedulesByTripId(tripId, month = null) {
    // TODO: Add a checker if there is month passed in to this function
    // this should return an Array
    return await Schedule.find({ tripId });
}


