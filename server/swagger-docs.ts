/**
 * Swagger API Documentation
 * 
 * This file contains all JSDoc comments for API documentation.
 * Keep this file to maintain Swagger docs without cluttering index.ts
 */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Create a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               grade:
 *                 type: string
 *               school:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input or user already exists
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login to user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /api/languages:
 *   get:
 *     summary: Get all available languages
 *     tags: [Languages]
 *     responses:
 *       200:
 *         description: List of supported languages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   code:
 *                     type: string
 *                   name:
 *                     type: string
 *                   nativeName:
 *                     type: string
 */

/**
 * @swagger
 * /api/grade:
 *   post:
 *     summary: Grade exam papers (single or dual mode)
 *     tags: [Grading]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               answerSheet:
 *                 type: string
 *                 format: binary
 *               questionPaper:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Grading results
 *       400:
 *         description: Invalid request
 */

/**
 * @swagger
 * /api/doubts/explain:
 *   post:
 *     summary: Get AI explanation for a question
 *     tags: [Doubts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               questionImage:
 *                 type: string
 *                 format: binary
 *               questionText:
 *                 type: string
 *               subject:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       200:
 *         description: Question explanation
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/doubts/history:
 *   get:
 *     summary: Get user's doubt history
 *     tags: [Doubts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's doubts
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/revision-friend/start:
 *   post:
 *     summary: Start a new revision session
 *     tags: [Revision Friend]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topic
 *               - subject
 *             properties:
 *               topic:
 *                 type: string
 *               subject:
 *                 type: string
 *               languageCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Revision session started
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/ncert-explainer/chapters:
 *   get:
 *     summary: Get list of NCERT chapters for a class and subject
 *     tags: [NCERT Explainer]
 *     parameters:
 *       - in: query
 *         name: class
 *         schema:
 *           type: string
 *         required: true
 *         description: Class number (e.g., "10")
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *         required: true
 *         description: Subject name (e.g., "Science", "Maths")
 *     responses:
 *       200:
 *         description: List of chapters
 *       400:
 *         description: Missing required parameters
 */

/**
 * @swagger
 * /api/smart-notes/health:
 *   get:
 *     summary: Health check for Smart Notes service
 *     tags: [Smart Notes]
 *     responses:
 *       200:
 *         description: Service health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 services:
 *                   type: object
 */

/**
 * @swagger
 * /api/smart-notes/ping:
 *   get:
 *     summary: Ping endpoint to verify Smart Notes API is working
 *     tags: [Smart Notes]
 *     responses:
 *       200:
 *         description: API is working
 */

/**
 * @swagger
 * /api/smart-notes:
 *   get:
 *     summary: Get all smart notes with optional filters
 *     tags: [Smart Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *       - in: query
 *         name: class
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: isFavorite
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of notes
 *       401:
 *         description: Unauthorized
 */

export {}; // Make this a module
