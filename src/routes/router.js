import apiRouter from './api-routes.js';
import ejsRoutes from './ejs-routes.js';
import { trainsApi, trainsPage } from './trains.js';
import { Router } from 'express';
import { homePage, aboutPage, testErrorPage } from './index.js';
import authRoutes from './auth.js';
import { adminDashboardPage } from '../controllers/admin.js';
import { requirePageLogin, requirePageRole } from '../middleware/auth.js';
import { standard_dashboard } from '../controllers/dashboard.js';

const router = Router();

router.use(authRoutes);

// Home page
router.get('/', homePage);

// About page
router.get('/about', aboutPage);

// Admin dashboard
router.get('/admin', requirePageLogin(), requirePageRole('admin'), adminDashboardPage);

// User Dashboard
router.get('/dashboard', requirePageLogin(), standard_dashboard)

// Trains page
router.get('/trains', trainsPage);

// Trains API
router.get('/api/trains', trainsApi);

// Trips API
router.use(apiRouter);

// Rail trips
router.use('/trips', ejsRoutes);

// Test 500 error page
router.get('/500', testErrorPage);

export default router;