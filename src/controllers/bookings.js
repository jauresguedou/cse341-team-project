import { getDb } from '../db/connect.js';
import { generateConfirmationCode } from '../includes/helpers.js';
import {
    createBooking,
    getAllBookings
} from '../models/bookings.js';

const bookingPage = async (req, res) => {
    const { scheduleId } = req.params;

    const db = getDb();

    const schedule = await db
        .collection('schedules')
        .findOne({ id: Number(scheduleId) });

    const trip = await db
        .collection('trips')
        .findOne({ id: schedule.tripId });

    const ticketClasses = await db
        .collection('ticketClasses')
        .find({})
        .toArray();

    const ticketOptions = ticketClasses.map((ticketClass) => ({
        class: ticketClass.class,
        name: ticketClass.name,
        price: trip.distance * ticketClass.pricePerKm,
        amenities: ticketClass.amenities,
        description: ticketClass.description
    }));

    return res.render('trips/book', {
        title: 'Book Trip',
        schedule,
        ticketOptions
    });
};

const processBookingRequest = async (req, res) => {
    const booking = {
        id: generateConfirmationCode(),
        createdAt: new Date(),
        ...req.body
    };

    await createBooking(booking);

    return res.redirect(`/trips/confirmation/${booking.id}`);
};

const getAllBookingsHandler = async (req, res) => {
    try {
        const bookings = await getAllBookings();

        return res.status(200).json(bookings);
    } catch (error) {
        console.error('Failed to retrieve bookings:', error.message);

        return res.status(500).json({
            message: 'Unable to retrieve bookings'
        });
    }
};

const bookingsPage = async (req, res) => {
    return res.render('bookings/bookings-admin', {
        title: 'Bookings Admin'
    });
}

export {
    bookingPage,
    processBookingRequest,
    getAllBookingsHandler,
    bookingsPage
}; 