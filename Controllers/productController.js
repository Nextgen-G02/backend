import Product from '../models/Product.js';


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

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products", error: err.message });
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

 export { addProduct, getProducts, deleteProduct };