import express from 'express';
import { getTodayDrawer, closeDrawer, getDrawerHistory, updateDrawer } from '../../Controllers/system/cashDrawerController.js';

const router = express.Router();

router.get('/today', getTodayDrawer);
router.post('/close', closeDrawer);
router.put('/:id', updateDrawer);
router.get('/history', getDrawerHistory);

export default router;
