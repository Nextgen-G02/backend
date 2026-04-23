
import Product from "../models/product.js";



// add new product
const addProduct = (req, res) => {
    const product = new Product(req.body);
    product.save().then(
      () => {
         res.json({
            message: "Product added successfully"
         })
      }
    )
};

const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products", error: err.message });
  }
};

const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteProduct = async (req, res) => {
  try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

 export { addProduct, getProducts,updateProduct, deleteProduct };