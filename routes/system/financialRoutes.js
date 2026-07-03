import express from 'express';
import { 
    getFinancialSummary, 
    getDailyRevenue, 
    getMonthlyRevenue 
} from '../../Controllers/system/financialController.js';
import { auth } from '../../middleware/authMiddleware.js';
import { authorizeRoles } from '../../middleware/roleMiddleware.js';


//Routes for financial summary and reports
const router = express.Router();

router.use(auth);
router.use(authorizeRoles('admin'));

router.get('/summary', getFinancialSummary);
router.get('/daily-revenue', getDailyRevenue);
router.get('/monthly-revenue', getMonthlyRevenue);

export default router;