import Product from '../../models/product.model.js';

export const addProduct = async (req, res) => {
    try {
        const { 
            productId, 
            pName, 
            pCategory, 
            description, 
            images, 
            weight, 
            price, 
            costPrice,
            stock,
            expiryDate,
            unit,
            status,
            isIngredient,
            recipe
         } = req.body;

         const existingProduct = await Product.findOne({ productId });
            if (existingProduct) {
                return res.status(400).json({ 
                    success:false,
                    message: 'Product ID already exists' 
                });
            }

            let stockStatus = "In Stock";
            if (stock === 0) {
                stockStatus = "Out of Stock";
            } else if (stock < 5) {
                stockStatus = "Low Stock";
            }

            const newProduct = new Product({
               productId,
               pName,
               pCategory,
               description,
               images,
               weight,
               price,
               costPrice,
               stock,
               expiryDate,
               unit,
               status,
               stockStatus,
               isIngredient: isIngredient || false,
               recipe: recipe || []
    });

        await newProduct.save();

        res.status(201).json({
            success:true,
            message: 'Product added successfully',
            data: newProduct
        });
    }
    catch (error) {
        res.status(500).json({
            success:false,
            message: 'Failed to add product',
            error: error.message
        });
    }
};
export const getProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.status(200).json({
            success: true,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products',
            error: error.message
        });
    }
};

export const getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        // Improved regex to match singular and plural (e.g., "cake" matches "Cakes")
        const products = await Product.find({ 
            pCategory: { $regex: new RegExp(`^${category}s?$`, 'i') } 
        });
        
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products by category',
            error: error.message
        });
    }
};
export const updateProduct = async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        res.status(200).json({ success: true, message: "Product deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};