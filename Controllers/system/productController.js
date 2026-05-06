import Product from '../../models/product.model.js';
import Inventory from '../../models/Inventory.js';
import InventoryHistory from '../../models/InventoryHistory.js';
import Expense from '../../models/Expense.js';

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

        if (price <= 0 || costPrice <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Price and Cost Price must be greater than 0'
            });
        }

        const existingProduct = await Product.findOne({ productId });
        if (existingProduct) {
            return res.status(400).json({
                success: false,
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
            success: true,
            message: 'Product added successfully',
            data: newProduct
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
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
        const oldProduct = await Product.findById(req.params.id);
        if (!oldProduct) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const { stock, price, costPrice } = req.body;

        if ((price !== undefined && price <= 0) || (costPrice !== undefined && costPrice <= 0)) {
            return res.status(400).json({
                success: false,
                message: 'Price and Cost Price must be greater than 0'
            });
        }

        // Handle stock changes for history and inventory sync
        if (stock !== undefined && stock !== oldProduct.stock) {
            const difference = stock - oldProduct.stock;
            const type = difference > 0 ? 'IN' : 'OUT';
            const reason = req.body.updateReason || "Inventory Update";

            await InventoryHistory.create({
                productId: oldProduct._id,
                type,
                quantity: Math.abs(difference),
                reason,
                date: new Date()
            });

            await Inventory.findOneAndUpdate(
                { productId: oldProduct._id },
                { quantity: stock, lastUpdated: new Date() },
                { upsert: true }
            );

            // Automatically log financial loss if expired or damaged
            if (type === 'OUT' && (reason === 'Expired Cake' || reason === 'Damaged')) {
                const lossAmount = Math.abs(difference) * (oldProduct.costPrice || 0);
                if (lossAmount > 0) {
                    await Expense.create({
                        category: 'Other',
                        amount: lossAmount,
                        description: `Waste Loss: ${oldProduct.pName} (${Math.abs(difference)} units) - ${reason}`,
                        date: new Date()
                    });
                }
            }

            // Update stock status automatically
            let stockStatus = "In Stock";
            if (stock === 0) stockStatus = "Out of Stock";
            else if (stock < 5) stockStatus = "Low Stock";
            req.body.stockStatus = stockStatus;
        }

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