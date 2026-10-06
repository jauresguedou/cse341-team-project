import { dashboard_bookings } from '../controllers/dashboard.js';
import { tripDetailsPage, tripListPage } from '../controllers/trips.js';
import { bookingPage, processBookingRequest } from './book.js';
import confirmationPage from './confirm.js';
import { Router } from 'express';

const router = Router();
router.get('/user-booking', dashboard_bookings)

router.get('/', tripListPage);
router.get('/booking/:scheduleId', bookingPage);
router.post('/book', processBookingRequest);
router.get('/confirmation/:confirmationId', confirmationPage);
router.get('/:tripId', tripDetailsPage);


export default router;
