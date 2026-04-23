import express from 'express';
const router = express.Router();
import * as orderController from '../../Controllers/system/orderController.js';
import { auth } from '../../middleware/authMiddleware.js';
import { authorizeRoles } from '../../middleware/roleMiddleware.js';

// Apply auth to all order routes
router.use(auth);

router.post('/', orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.put('/:id', orderController.updateOrder);
router.patch('/:id/status', orderController.updateStatus);

// Restricted to Admin only
router.delete('/:id', authorizeRoles('admin'), orderController.deleteOrder);

export default router;