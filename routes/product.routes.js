import express from 'express';
import {
  createProduct,
  listProducts,
  getProductById
} from '../Controllers/productController.js';
import { auth } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// anyone can view the product list and product details
router.get('/', listProducts);
router.get('/:id', getProductById);

// only admin or staff can create new products
router.post('/', auth, authorizeRoles('admin', 'staff'), createProduct);

export default router;
