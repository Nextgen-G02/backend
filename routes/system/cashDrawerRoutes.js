import express from 'express';
import { getTodayDrawer, closeDrawer, getDrawerHistory, updateDrawer } from '../../Controllers/system/cashDrawerController.js';

const router = express.Router();

router.get('/today', getTodayDrawer);
router.post('/close', closeDrawer);
router.get('/history', getDrawerHistory);
router.put('/:id', updateDrawer);

export default router;
