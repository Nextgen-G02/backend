import express from 'express';
import { addProduct ,deleteProduct,updateProduct,getProducts,} from "../Controllers/productController.js";

const routes = express.Router();

routes.post("/add", addProduct);
routes.get("/get", getProducts);   
// routes.get("/get/:id", getProductById);
routes.put("/update/:id", updateProduct);
routes.delete("/delete/:id", deleteProduct);


export default routes;
