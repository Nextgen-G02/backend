import express from 'express';
import { getInventory, updateLowStockThreshold, syncInventory } from '../../Controllers/system/inventoryController.js';
import { auth } from '../../middleware/authMiddleware.js';
import { authorizeRoles } from '../../middleware/roleMiddleware.js';

const router = express.Router();

router.use(auth);
router.use(authorizeRoles('admin', 'staff'));

router.get('/', getInventory);
router.patch('/:id/threshold', updateLowStockThreshold);
router.post('/sync', syncInventory);

export default router;