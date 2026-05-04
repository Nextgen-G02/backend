import Inventory from '../../models/Inventory.js';
import Product from '../../models/product.model.js';
import InventoryHistory from '../../models/InventoryHistory.js';

export const getInventory = async (req, res) => {
    try {
        const inventory = await Inventory.find().populate('productId');
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

export const getInventoryHistory = async (req, res) => {
    try {
        const { productId, type, startDate, endDate } = req.query;
        let query = {};

        if (productId) query.productId = productId;
        if (type) query.type = type;
        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const history = await InventoryHistory.find(query)
            .populate('productId', 'pName productId')
            .sort({ date: -1 })
            .limit(100);

        res.status(200).json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};