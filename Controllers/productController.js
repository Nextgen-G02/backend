import Product from '../models/Product.js';

// const addProduct = async (req, res) => {
//     const product = new Product(req.body);
//     product.save()
// };

//  export { addProduct };

const addProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    const saved = await product.save();
    res.status(201).json({ message: "Product added successfully", product: saved });
  } catch (error) {
    res.status(500).json({ message: "Failed to add product", error: error.message });
  }
};

export { addProduct };
