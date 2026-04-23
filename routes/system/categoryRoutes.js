import express from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../Controllers/system/categoryController.js';
import { auth } from '../../middleware/authMiddleware.js';
import { authorizeRoles } from '../../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', getCategories);
router.post('/', auth, authorizeRoles('admin'), createCategory);
router.put('/:id', auth, authorizeRoles('admin'), updateCategory);
router.delete('/:id', auth, authorizeRoles('admin'), deleteCategory);

export default router;
