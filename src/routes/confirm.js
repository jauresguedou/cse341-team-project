import { getBookingById } from '../models/bookings.js';

export default async (req, res) => {
    const { confirmationId } = req.params;

    const booking = await getBookingById(confirmationId);

    return res.render('trips/confirm', {
        title: 'Trip Confirmation',
        confirmation: booking
    });
};