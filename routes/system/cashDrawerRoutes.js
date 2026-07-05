import express from 'express';
import { getTodayDrawer, closeDrawer, getDrawerHistory, updateDrawer, openDrawer, withdrawFromDrawer, deleteDrawer } from '../../Controllers/system/cashDrawerController.js';

const router = express.Router();

router.get('/today', getTodayDrawer);
router.post('/open', openDrawer);
router.post('/close', closeDrawer);
router.post('/withdraw', withdrawFromDrawer);
router.get('/history', getDrawerHistory);
router.put('/:id', updateDrawer);
router.delete('/:id', deleteDrawer);

export default router;
