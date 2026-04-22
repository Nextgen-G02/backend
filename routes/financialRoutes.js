import express from 'express';
import { getFinancialSummary } from '../Controllers/financialController.js';
import { auth } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(auth);
router.use(authorizeRoles('admin'));

router.get('/summary', getFinancialSummary);

export default router;
