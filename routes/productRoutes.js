import express from 'express';
import { addProduct ,deleteProduct,getProducts,} from "../Controllers/productController.js";

const productRoutes = express.Router();

productRoutes.post("/add", addProduct);
productRoutes.get("/get", getProducts);   
// productRoutes.get("/get/:id", getProductById);
// productRoutes.put("/update/:id", updateProduct);
productRoutes.delete("/delete/:id", deleteProduct);


export default productRoutes;
