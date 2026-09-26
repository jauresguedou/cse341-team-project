import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true
        },

        createdAt: {
            type: Date,
            required: true,
            default: Date.now
        }
    },
    {
        strict: false,
        collection: 'bookings'
    }
);

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;