import Order from '../../models/order.model.js';
import Product from '../../models/product.model.js';
import Inventory from '../../models/Inventory.js';
import Customer from '../../models/customer.model.js';





// CREATE ORDER
export const createOrder = async (req, res) => {
    try {
        const orderData = { ...req.body };

        if (req.user) {
            orderData.createdBy = req.user._id;
        }

        // Default values for DirectSale
        if (orderData.type === 'DirectSale') {
            orderData.orderStatus = 'Delivered';
            orderData.paymentStatus = 'Paid';
        }

        // 1. Validate stock for all items first
        for (const item of orderData.items) {
            const product = await Product.findOne({ pName: item.pName });
            if (product) {
                if (product.stock < item.quantity) {
                    throw new Error(`Not enough stock for ${product.pName}`);
                }
            }
        }

        // 2. Save the order
        const order = new Order(orderData);
        await order.save();

        // 3. Update Customer record
        if (order.phone) {
            await Customer.findOneAndUpdate(
                { phone: order.phone },
                { 
                    $set: { name: order.customerName, address: order.address, lastOrderDate: Date.now() },
                    $inc: { totalOrders: 1, totalSpent: order.totalAmount }
                },
                { upsert: true, new: true }
            );
        }

        // 4. Process items for inventory and stock reduction
        for (const item of order.items) {
            const product = await Product.findOne({ pName: item.pName });

            if (product) {
                const newStock = product.stock - item.quantity;
                
                // Determine new stock status
                let newStockStatus = "In Stock";
                if (newStock === 0) {
                    newStockStatus = "Out of Stock";
                } else if (newStock < 5) {
                    newStockStatus = "Low Stock";
                }

                // Update product stock and status without triggering full validation
                await Product.findByIdAndUpdate(product._id, {
                    $set: { 
                        stock: newStock,
                        stockStatus: newStockStatus
                    }
                });

                // Update Inventory model
                await Inventory.findOneAndUpdate(
                    { productId: product._id },
                    { 
                        quantity: newStock,
                        lastUpdated: Date.now()
                    },
                    { upsert: true }
                );
            } else {
                console.log(`Processing custom item: ${item.pName}`);
            }
        }

        res.status(201).json(order);

    } catch (error) {
        console.error("Order creation error:", error);
        res.status(400).json({ message: error.message });
    }
};



// GET ALL ORDERS
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



// GET ORDER BY ID

export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



// UPDATE ORDER
export const updateOrder = async (req, res) => {
    try {
        const oldOrder = await Order.findById(req.params.id);

        if (!oldOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        //  If order cancelled → restore stock
        if (req.body.orderStatus === 'Cancelled' && oldOrder.orderStatus !== 'Cancelled') {

            for (const item of order.items) {

                const product = await Product.findOne({
                    pName: item.pName   //  CHANGED HERE
                });

                if (product) {
                    const newStock = product.stock + item.quantity;
                    let newStockStatus = "In Stock";
                    if (newStock === 0) newStockStatus = "Out of Stock";
                    else if (newStock < 5) newStockStatus = "Low Stock";

                    await Product.findByIdAndUpdate(product._id, {
                        $set: { stock: newStock, stockStatus: newStockStatus }
                    });

                    // Sync Inventory
                    await Inventory.findOneAndUpdate(
                        { productId: product._id },
                        { 
                            quantity: newStock,
                            lastUpdated: Date.now()
                        },
                        { upsert: true }
                    );
                }
            }
        }


        res.json(order);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};



// UPDATE ORDER STATUS ONLY
export const updateStatus = async (req, res) => {
    try {
        const { orderStatus: newStatus } = req.body;
        const oldOrder = await Order.findById(req.params.id);

        if (!oldOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const oldStatus = oldOrder.orderStatus;

        // If status hasn't changed, just return
        if (oldStatus === newStatus) {
            return res.json(oldOrder);
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { orderStatus: newStatus },
            { new: true }
        );

        // --- STOCK LOGIC ---

        // 1. If moving TO 'Cancelled' from any other state -> Restore Stock
        if (newStatus === 'Cancelled' && oldStatus !== 'Cancelled') {
            for (const item of order.items) {
                const product = await Product.findOne({ pName: item.pName });
                if (product) {
                    const newStock = product.stock + item.quantity;
                    let newStockStatus = "In Stock";
                    if (newStock === 0) newStockStatus = "Out of Stock";
                    else if (newStock < 5) newStockStatus = "Low Stock";

                    await Product.findByIdAndUpdate(product._id, {
                        $set: { stock: newStock, stockStatus: newStockStatus }
                    });

                    // Sync Inventory
                    await Inventory.findOneAndUpdate(
                        { productId: product._id },
                        { quantity: newStock, lastUpdated: Date.now() },
                        { upsert: true }
                    );
                }
            }
        } 
        // 2. If moving FROM 'Cancelled' to any other state -> Reduce Stock
        else if (oldStatus === 'Cancelled' && newStatus !== 'Cancelled') {
            for (const item of order.items) {
                const product = await Product.findOne({ pName: item.pName });
                if (product) {
                    // Check if enough stock exists to restore the order
                    if (product.stock < item.quantity) {
                        // Rollback status if not enough stock? 
                        // For simplicity, we'll throw error, but in a real app we might want a transaction
                        await Order.findByIdAndUpdate(req.params.id, { orderStatus: oldStatus });
                        throw new Error(`Insufficient stock for ${product.pName} to restore order`);
                    }

                    const newStock = product.stock - item.quantity;
                    let newStockStatus = "In Stock";
                    if (newStock === 0) newStockStatus = "Out of Stock";
                    else if (newStock < 5) newStockStatus = "Low Stock";

                    await Product.findByIdAndUpdate(product._id, {
                        $set: { stock: newStock, stockStatus: newStockStatus }
                    });

                    // Sync Inventory
                    await Inventory.findOneAndUpdate(
                        { productId: product._id },
                        { quantity: newStock, lastUpdated: Date.now() },
                        { upsert: true }
                    );
                }
            }
        }

        res.json(order);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};



// DELETE ORDER
export const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({ message: 'Order deleted successfully' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};