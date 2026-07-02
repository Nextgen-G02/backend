import express from 'express';
import { 
    createCustomCakeRequest, 
    getCustomerRequests, 
    updatePaymentStatus 
} from '../Controllers/web/customCakeController.js';
import { 
    getAllRequests, 
    updateRequestStatus 
} from '../Controllers/system/adminCustomCakeController.js';

const router = express.Router();

// --- Customer Routes ---
// Create a new custom cake request
router.post('/request', createCustomCakeRequest);

// Get requests for a specific customer
router.get('/customer', getCustomerRequests);

// Update payment status (after PayHere success)
router.put('/:id/pay', updatePaymentStatus);

// --- Admin Routes ---
// Get all custom cake requests (Admin Dashboard)
router.get('/admin/all', getAllRequests);

// Update request status / price / approval (Admin)
router.put('/admin/:id/status', updateRequestStatus);


export default router;
