import { Router } from 'express';
import {
    currentUserApi,
    loginApi,
    loginPage,
    loginPageSubmit,
    logout,
    logoutApi,
    registerApi,
    registerPage,
    registerPageSubmit,
} from '../controllers/auth.js';
import { requireApiLogin } from '../middleware/auth.js';

const router = Router();

router.get('/register', registerPage);
router.post('/register', registerPageSubmit);
router.get('/login', loginPage);
router.post('/login', loginPageSubmit);
router.post('/logout', logout);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthenticationResponse'
 *       400:
 *         description: Invalid registration data
 *       409:
 *         description: Username or email is already in use
 *       500:
 *         description: Unable to register user
 */
router.post('/api/auth/register', registerApi);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: User logged in and a session cookie was created
 *         headers:
 *           Set-Cookie:
 *             description: HTTP-only session cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Username and password are required
 *       401:
 *         description: Invalid username or password
 *       500:
 *         description: Authentication service failure
 */
router.post('/api/auth/login', loginApi);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get the currently authenticated user
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Authentication required
 */
router.get('/api/auth/me', requireApiLogin(), currentUserApi);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out the current user
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       204:
 *         description: Session destroyed and cookie cleared
 *       500:
 *         description: Unable to destroy the session
 */
router.post('/api/auth/logout', logoutApi);

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: connect.sid
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - displayName
 *         - username
 *         - email
 *         - password
 *       properties:
 *         displayName:
 *           type: string
 *           example: Jordan Lee
 *         username:
 *           type: string
 *           example: jordanlee
 *         email:
 *           type: string
 *           format: email
 *           example: jordan@example.com
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           example: correct-horse-battery
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           example: jordanlee
 *         password:
 *           type: string
 *           format: password
 *           example: correct-horse-battery
 *     SafeUser:
 *       type: object
 *       required:
 *         - id
 *         - displayName
 *         - username
 *         - email
 *         - role
 *       properties:
 *         id:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         displayName:
 *           type: string
 *           example: Jordan Lee
 *         username:
 *           type: string
 *           example: jordanlee
 *         email:
 *           type: string
 *           format: email
 *           example: jordan@example.com
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           example: user
 *     AuthenticationResponse:
 *       type: object
 *       required:
 *         - message
 *         - user
 *       properties:
 *         message:
 *           type: string
 *           example: Registration successful
 *         user:
 *           $ref: '#/components/schemas/SafeUser'
 *     UserResponse:
 *       type: object
 *       required:
 *         - user
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/SafeUser'
 */

export default router;