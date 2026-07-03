import express from 'express';
import { createExpense, getExpenses, updateExpense, deleteExpense, getExpenseStats } from '../../Controllers/system/expenseController.js';

const router = express.Router();

router.post('/', createExpense);
router.get('/', getExpenses);
router.get('/stats', getExpenseStats);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
