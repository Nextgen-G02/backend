const express = require('express');
const router = express.Router();
const orderController = require('../Controllers/orderController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/', protect, orderController.createOrder);
router.get('/', protect, orderController.getOrders);
router.get('/:id', protect, orderController.getOrderById);
router.put('/:id', protect, orderController.updateOrder);
router.patch('/:id/status', protect, orderController.updateStatus);
router.delete('/:id', protect, authorize('Admin'), orderController.deleteOrder);

module.exports = router;
