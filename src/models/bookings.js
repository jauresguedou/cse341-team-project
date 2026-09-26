import Booking from './schemas/bookings.js';

const createBooking = async (bookingData) => {
  const booking = new Booking(bookingData);

  return await booking.save();
};

const getAllBookings = async () => {
  return await Booking.find({}).lean();
};

const getBookingById = async (bookingId) => {
  return await Booking.findOne({ id: bookingId }).lean();
};

export {
  createBooking,
  getAllBookings,
  getBookingById
};