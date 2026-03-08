import express from 'express';
import { addProduct } from "../Controllers/productController.js";

const productRoutes = express.Router();
productRoutes.post("/add", addProduct);

export default productRoutes;
