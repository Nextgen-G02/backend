import express from "express";
import { addProduct, getProducts, getProductsByCategory } from "../Controllers/productController.js";
import { auth } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
const productRoutes = express.Router();

productRoutes.post("/add", auth, authorizeRoles("admin", "staff"), addProduct);
productRoutes.get("/", getProducts);
productRoutes.get("/category/:category", getProductsByCategory);

export default productRoutes;

