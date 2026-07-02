import express from "express";
import { 
    addProduct, 
    getProducts, 
    getProductsByCategory, 
    getProductById,
    updateProduct, 
    deleteProduct 
} from "../../Controllers/system/productController.js";
import { auth } from "../../middleware/authMiddleware.js";
import { authorizeRoles } from "../../middleware/roleMiddleware.js";
import upload from "../../middleware/uploadMiddleware.js";
const productRoutes = express.Router();

productRoutes.post("/add", auth, authorizeRoles("admin", "staff"), upload.single('image'), addProduct);
productRoutes.get("/", getProducts);
productRoutes.get("/category/:category", getProductsByCategory);
productRoutes.get("/:id", getProductById);
productRoutes.put("/update/:id", auth, authorizeRoles("admin", "staff"), upload.single('image'), updateProduct);
productRoutes.delete("/delete/:id", auth, authorizeRoles("admin", "staff"), deleteProduct);

export default productRoutes;