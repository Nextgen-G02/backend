import Product from '../models/Product.js';

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

 export { addProduct };

