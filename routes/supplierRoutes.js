import express from "express";
import { 
  getSuppliers, 
  getSupplierById, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier 
} from "../Controllers/supplierController.js";
import { auth } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(auth);
router.use(authorizeRoles("admin"));

router.route("/")
  .get(getSuppliers)
  .post(createSupplier);

router.route("/:id")
  .get(getSupplierById)
  .put(updateSupplier)
  .delete(deleteSupplier);

export default router;
