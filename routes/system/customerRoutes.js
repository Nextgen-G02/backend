import express from 'express';
import { getCustomers, getCustomerByPhone, deleteCustomer, updateCustomer } from '../../Controllers/system/customerController.js';
import { auth } from '../../middleware/authMiddleware.js';
import { authorizeRoles } from '../../middleware/roleMiddleware.js';

const router = express.Router();

router.use(auth);
router.use(authorizeRoles('admin', 'staff'));

router.get('/', getCustomers);
router.get('/:phone', getCustomerByPhone);
router.put('/:id', authorizeRoles('admin'), updateCustomer);
router.delete('/:id', authorizeRoles('admin'), deleteCustomer);

export default router;