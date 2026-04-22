import express from 'express';
import { getCustomers, getCustomerByPhone, deleteCustomer } from '../Controllers/customerController.js';
import { auth } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(auth);
router.use(authorizeRoles('admin', 'staff'));

router.get('/', getCustomers);
router.get('/:phone', getCustomerByPhone);
router.delete('/:id', authorizeRoles('admin'), deleteCustomer);

export default router;
