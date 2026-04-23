import express from 'express';
const router = express.Router();
import * as orderController from '../Controllers/orderController.js';
import { auth } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

// router.post('/', auth, orderController.createOrder);
// router.get('/', auth, orderController.getOrders);
// router.get('/:id', auth, orderController.getOrderById);
// router.put('/:id', auth, orderController.updateOrder);
// router.patch('/:id/status', auth, orderController.updateStatus);
// router.delete('/:id', auth, authorizeRoles('Admin'), orderController.deleteOrder);

router.post('/', orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.put('/:id', orderController.updateOrder);
router.patch('/:id/status', orderController.updateStatus);

// even admin restriction removed
router.delete('/:id', orderController.deleteOrder);

export default router;
