import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
// import InventoryHistory from '../models/InventoryHistory.js'; // Model not found

// Create a new order
export const createOrder = async (req, res) => {
    try {
        const orderData = { ...req.body };
        if (req.user) {
            orderData.createdBy = req.user._id;
        }

        // Default values for Direct Sales
        if (orderData.type === 'DirectSale') {
            orderData.orderStatus = 'Delivered';
            orderData.paymentStatus = 'Paid';
        }

        const order = new Order(orderData);
        await order.save();

        // Reduce stock for each item in the order
        for (const item of order.items) {
            const product = await Product.findOne({
                $or: [
                    { productName: item.productName },
                    { pName: item.productName }
                ]
            });
            if (product) {
                if (product.stock !== undefined) {
                    product.stock -= item.quantity;
                } else if (product.stockQuantity !== undefined) {
                    product.stockQuantity -= item.quantity;
                }
                await product.save();

                // const history = new InventoryHistory({
                //     product: product._id,
                //     type: 'OUT',
                //     quantity: item.quantity,
                //     reason: `Order Created: ${order._id}`
                // });
                // await history.save();
            }
        }

        res.status(201).json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all orders
export const getOrders = async (req, res) => {
    try {
        const { customerName, status, date } = req.query;
        let query = {};

        if (customerName) {
            query.customerName = { $regex: customerName, $options: 'i' };
        }
        if (status) {
            query.orderStatus = status;
        }
        if (date) {
            query.scheduleDate = date;
        }

        const orders = await Order.find(query).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single order
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update an order
export const updateOrder = async (req, res) => {
    try {
        const oldOrder = await Order.findById(req.params.id);
        if (!oldOrder) return res.status(404).json({ message: 'Order not found' });

        const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        // If status changed to Cancelled, restore stock
        if (req.body.orderStatus === 'Cancelled' && oldOrder.orderStatus !== 'Cancelled') {
            for (const item of order.items) {
                const product = await Product.findOne({
                    $or: [
                        { productName: item.productName },
                        { pName: item.productName }
                    ]
                });
                if (product) {
                    if (product.stock !== undefined) {
                        product.stock += item.quantity;
                    } else if (product.stockQuantity !== undefined) {
                        product.stockQuantity += item.quantity;
                    }
                    await product.save();
                }
            }
        }
        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update order status
export const updateStatus = async (req, res) => {
    try {
        const oldOrder = await Order.findById(req.params.id);
        if (!oldOrder) return res.status(404).json({ message: 'Order not found' });

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { orderStatus: req.body.orderStatus },
            { new: true }
        );

        // If status changed to Cancelled, restore stock
        if (req.body.orderStatus === 'Cancelled' && oldOrder.orderStatus !== 'Cancelled') {
            for (const item of order.items) {
                const product = await Product.findOne({
                    $or: [
                        { productName: item.productName },
                        { pName: item.productName }
                    ]
                });
                if (product) {
                    if (product.stock !== undefined) {
                        product.stock += item.quantity;
                    } else if (product.stockQuantity !== undefined) {
                        product.stockQuantity += item.quantity;
                    }
                    await product.save();
                }
            }
        }

        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete an order
export const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
