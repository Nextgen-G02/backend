const Product = require('../models/Product');
const InventoryHistory = require('../models/InventoryHistory');

// Get all inventory
exports.getInventory = async (req, res) => {
    try {
        const products = await Product.find().populate('category');
        return res.status(200).json(products);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Get low stock products
exports.getLowStock = async (req, res) => {
    try {
        const MIN_STOCK = 5; // constant for easy change later
        const products = await Product.find({
            stockQuantity: { $lte: MIN_STOCK }
        }).populate('category');

        return res.status(200).json(products);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Adjust stock (IN / OUT)
exports.adjustStock = async (req, res) => {
    try {
        let { productId, type, quantity, reason } = req.body;
        quantity = Number(quantity); // ensure number

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (type === 'IN') {
            product.stockQuantity += quantity;
        } else if (type === 'OUT') {
            if (product.stockQuantity < quantity) {
                return res.status(400).json({ message: 'Insufficient stock' });
            }
            product.stockQuantity -= quantity;
        } else {
            return res.status(400).json({ message: 'Invalid type (IN or OUT)' });
        }

        await product.save();

        const history = new InventoryHistory({
            product: productId,
            type,
            quantity,
            reason
        });

        await history.save();

        return res.status(200).json({ product, history });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// Get product history
exports.getHistory = async (req, res) => {
    try {
        const history = await InventoryHistory.find({
            product: req.params.productId
        })
            .sort({ date: -1 })
            .populate('product');

        return res.status(200).json(history);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};