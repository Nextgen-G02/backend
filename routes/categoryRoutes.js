import express from 'express';
import { createCategory, getCategories, deleteCategory } from '../Controllers/categoryController.js';
import { auth } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', getCategories);
router.post('/', auth, authorizeRoles('admin'), createCategory);
router.delete('/:id', auth, authorizeRoles('admin'), deleteCategory);

export default router;
