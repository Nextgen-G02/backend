const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

router.get('/', inventoryController.getInventory);
router.get('/low-stock', inventoryController.getLowStock);
router.post('/adjust', inventoryController.adjustStock);
router.get('/history/:productId', inventoryController.getHistory);

module.exports = router;
