import express from "express";
import { 
    createReview, 
    getApprovedReviews, 
    getAllReviewsAdmin, 
    updateReviewStatus, 
    deleteReview,
    getProductReviews
} from "../../Controllers/web/reviewController.js";
import { auth } from "../../middleware/authMiddleware.js";
import { authorizePermission } from "../../middleware/roleMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getApprovedReviews);
router.get("/product/:productId", getProductReviews);

// Customer routes
router.post("/", auth, createReview);

// Admin/Staff routes
router.get("/admin", auth, authorizePermission("manage_marketing"), getAllReviewsAdmin);
router.put("/:id/status", auth, authorizePermission("manage_marketing"), updateReviewStatus);
router.delete("/:id", auth, authorizePermission("manage_marketing"), deleteReview);

export default router;
