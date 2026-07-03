import express from 'express';
const router = express.Router();
import * as payhereController from '../../Controllers/system/payhereController.js';
import { auth } from '../../middleware/authMiddleware.js';

// Public route for PayHere to send webhook notifications
router.post('/notify', express.urlencoded({ extended: true }), payhereController.payhereNotify);

// Protected route for frontend to get the MD5 hash
router.post('/hash', auth, payhereController.generateHash);

export default router;
