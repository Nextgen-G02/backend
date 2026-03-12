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

 export { addProduct, getProducts };

