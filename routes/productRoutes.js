import express from 'express';
import Product from "../models/product.js";
import { addProduct ,deleteProduct,getProducts,} from "../Controllers/productController.js";

const routes = express.Router();

routes.post("/add", addProduct);
routes.get("/get", getProducts);

// GET products by category
routes.get("/category/:category", async (req, res) => {
  try {
    const products = await Product.find({
      pCategory: req.params.category,
    }).limit(10);

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// routes.get("/get/:id", getProductById);
// routes.put("/update/:id", updateProduct);
routes.delete("/delete/:id", deleteProduct);


export default routes;
