import express from "express";
import { addProduct, getProducts } from "../Controllers/productController.js";
const productRoutes = express.Router();
productRoutes.post("/add", addProduct);
productRoutes.get("/", getProducts);

export default productRoutes;
