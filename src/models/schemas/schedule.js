import { model, Schema } from 'mongoose'

const scheduleSchema = new Schema({
    tripId: {
        type: String,
        enum: [
            'alpine-panorama',
            'coastal breeze',
            'sakura-valley',
            'gorge-explorer',
            'winter-wetlands',
            'romantic-gorge'
        ],
        required: true
    },
    departureTime: {
        type: Date,
        required: true
    },
    arrivalTime: {
        type: Date,
        required: true
    },
    dayOfTheWeek: {
        type: [String],
        enum: [
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
            'sunday'
        ],
        required: true
    },
    status: Boolean
})

const Schedule = model('Schedule', scheduleSchema)

export default Schedule;