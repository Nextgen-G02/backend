import express from "express";
import { 
    addProduct, 
    getProducts, 
    getProductsByCategory, 
    updateProduct, 
    deleteProduct 
} from "../../Controllers/system/productController.js";
import { auth } from "../../middleware/authMiddleware.js";
import { authorizeRoles } from "../../middleware/roleMiddleware.js";
const productRoutes = express.Router();

productRoutes.post("/add", auth, authorizeRoles("admin", "staff"), addProduct);
productRoutes.get("/", getProducts);
productRoutes.get("/category/:category", getProductsByCategory);
productRoutes.put("/update/:id", auth, authorizeRoles("admin", "staff"), updateProduct);
productRoutes.delete("/delete/:id", auth, authorizeRoles("admin", "staff"), deleteProduct);

export default productRoutes;

