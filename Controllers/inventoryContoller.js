const Product = require('../models/Product');
const InventoryHistory = require('../models/InventoryHistory');

exports.getInventory = async (req, res) => {
    try {
        const products = await Product.find().populate('category');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getLowStock = async (req, res) => {
    try {
        // Assuming minimum stock is 5 for now
        const products = await Product.find({ stockQuantity: { $lte: 5 } }).populate('category');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.adjustStock = async (req, res) => {
    try {
        const { productId, type, quantity, reason } = req.body;
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        if (type === 'IN') {
            product.stockQuantity += Number(quantity);
        } else if (type === 'OUT') {
            if (product.stockQuantity < quantity) {
                return res.status(400).json({ message: 'Insufficient stock' });
            }
            product.stockQuantity -= Number(quantity);
        }

        await product.save();

        const history = new InventoryHistory({
            product: productId,
            type,
            quantity,
            reason
        });
        await history.save();

        res.json({ product, history });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const history = await InventoryHistory.find({ product: req.params.productId })
            .sort({ date: -1 })
            .populate('product');
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
