import Inventory from '../models/Inventory.js';
import Product from '../models/product.model.js';

export const getInventory = async (req, res) => {
    try {
        const inventory = await Inventory.find().populate('productId', 'pName stockStatus');
        res.status(200).json({ success: true, data: inventory });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateLowStockThreshold = async (req, res) => {
    try {
        const { lowStockLevel } = req.body;
        const inventory = await Inventory.findByIdAndUpdate(
            req.params.id,
            { lowStockLevel },
            { new: true }
        );
        if (!inventory) {
            return res.status(404).json({ success: false, message: 'Inventory record not found' });
        }
        res.status(200).json({ success: true, data: inventory });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Sync inventory with product stock (helper or route)
export const syncInventory = async (req, res) => {
    try {
        const products = await Product.find();
        for (const product of products) {
            await Inventory.findOneAndUpdate(
                { productId: product._id },
                { quantity: product.stock },
                { upsert: true, new: true }
            );
        }
        res.status(200).json({ success: true, message: 'Inventory synced with products' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
