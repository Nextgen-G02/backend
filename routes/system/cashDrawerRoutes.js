import express from 'express';
import { getTodayDrawer, closeDrawer, getDrawerHistory, updateDrawer, openDrawer } from '../../Controllers/system/cashDrawerController.js';

const router = express.Router();

router.get('/today', getTodayDrawer);
router.post('/open', openDrawer);
router.post('/close', closeDrawer);
router.get('/history', getDrawerHistory);
router.put('/:id', updateDrawer);

export default router;
