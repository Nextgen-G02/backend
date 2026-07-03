import express from 'express';
const router = express.Router();
import * as alertController from '../../Controllers/system/alertController.js';
import { auth } from '../../middleware/authMiddleware.js';

router.get('/', auth, alertController.getUnreadAlerts);
router.patch('/:id/read', auth, alertController.markAsRead);
router.patch('/read-all', auth, alertController.markAllAsRead);

export default router;
