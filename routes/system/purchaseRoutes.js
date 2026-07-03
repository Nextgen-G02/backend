import express from "express";
import { 
  getSupplierPurchases, 
  createPurchase, 
  updatePurchase,
  deletePurchase,
  addPayment
} from "../../Controllers/system/purchaseController.js";
import { auth } from "../../middleware/authMiddleware.js";
import { authorizeRoles } from "../../middleware/roleMiddleware.js";

const router = express.Router();

router.use(auth);
router.use(authorizeRoles("admin"));

router.route("/")
  .post(createPurchase);

router.route("/supplier/:supplierId")
  .get(getSupplierPurchases);

router.route("/:id")
  .put(updatePurchase)
  .delete(deletePurchase);

router.route("/:id/payments")
  .post(addPayment);

export default router;