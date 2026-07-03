import Order from '../../models/order.model.js';
import Product from '../../models/product.model.js';
import Inventory from '../../models/Inventory.js';
import Customer from '../../models/customer.model.js';
import InventoryHistory from '../../models/InventoryHistory.js';
import User from '../../models/user.js';
import SystemAlert from '../../models/SystemAlert.js';





// --- HELPER FUNCTIONS ---
const triggerLowStockAlert = async (productId, productName, currentStock) => {
    try {
        if (currentStock >= 5) return; // Only trigger alert for stock levels below 5

        const type = currentStock <= 0 ? "Out of Stock" : "Low Stock";
        const message = `${productName} is ${type.toLowerCase()}! Current stock: ${currentStock}`;

        // Check if there is already an unread alert of the same type for this product
        const existingAlert = await SystemAlert.findOne({
            productId,
            type,
            read: false
        });

        if (!existingAlert) {
            await SystemAlert.create({
                productId,
                productName,
                message,
                type
            });
            console.log(`[SYSTEM ALERT] Product "${productName}" entered low stock threshold: ${currentStock}`);
        }
    } catch (error) {
        console.error("Failed to create system alert:", error);
    }
};

const processStockDeduction = async (order) => {
    for (const item of order.items) {
        const product = await Product.findOne({ pName: item.pName }).populate('recipe.ingredientId');
        if (product) {
            if (product.recipe && product.recipe.length > 0) {
                for (const ing of product.recipe) {
                    const ingredient = ing.ingredientId;
                    const deduction = (ing.quantity || 0) * (item.quantity || 1);
                    const newStock = (ingredient.stock || 0) - deduction;
                    const newStatus = newStock <= 0 ? "Out of Stock" : (newStock < 5 ? "Low Stock" : "In Stock");
                    
                    await Product.findByIdAndUpdate(ingredient._id, { $set: { stock: newStock, stockStatus: newStatus } });
                    await Inventory.findOneAndUpdate({ productId: ingredient._id }, { quantity: newStock, lastUpdated: Date.now() }, { upsert: true });
                    await triggerLowStockAlert(ingredient._id, ingredient.pName, newStock);
                    await InventoryHistory.create({
                        productId: ingredient._id,
                        type: 'OUT',
                        quantity: deduction,
                        reason: `Production Started: ${product.pName} (Order #${order._id})`,
                        orderId: order._id
                    });
                }
            } else {
                const deduction = (item.quantity || 1);
                const newStock = (product.stock || 0) - deduction;
                const newStatus = newStock <= 0 ? "Out of Stock" : (newStock < 5 ? "Low Stock" : "In Stock");
                
                await Product.findByIdAndUpdate(product._id, { $set: { stock: newStock, stockStatus: newStatus } });
                await Inventory.findOneAndUpdate({ productId: product._id }, { quantity: newStock, lastUpdated: Date.now() }, { upsert: true });
                await triggerLowStockAlert(product._id, product.pName, newStock);
                await InventoryHistory.create({
                    productId: product._id,
                    type: 'OUT',
                    quantity: deduction,
                    reason: `Order Processed (#${order._id})`,
                    orderId: order._id
                });
            }
        }
    }
};

const processStockRestoration = async (order, reason) => {
    for (const item of order.items) {
        const product = await Product.findOne({ pName: item.pName }).populate('recipe.ingredientId');
        if (product) {
            if (product.recipe && product.recipe.length > 0) {
                for (const ing of product.recipe) {
                    const ingredient = ing.ingredientId;
                    const restoration = (ing.quantity || 0) * (item.quantity || 1);
                    const newStock = (ingredient.stock || 0) + restoration;
                    const newStatus = newStock <= 0 ? "Out of Stock" : (newStock < 5 ? "Low Stock" : "In Stock");

                    await Product.findByIdAndUpdate(ingredient._id, { $set: { stock: newStock, stockStatus: newStatus } });
                    await Inventory.findOneAndUpdate({ productId: ingredient._id }, { quantity: newStock, lastUpdated: Date.now() }, { upsert: true });
                    await InventoryHistory.create({
                        productId: ingredient._id,
                        type: 'IN',
                        quantity: restoration,
                        reason: reason || `Order Adjustment (#${order._id})`,
                        orderId: order._id
                    });
                }
            } else {
                const restoration = (item.quantity || 1);
                const newStock = (product.stock || 0) + restoration;
                const newStatus = newStock <= 0 ? "Out of Stock" : (newStock < 5 ? "Low Stock" : "In Stock");

                await Product.findByIdAndUpdate(product._id, { $set: { stock: newStock, stockStatus: newStatus } });
                await Inventory.findOneAndUpdate({ productId: product._id }, { quantity: newStock, lastUpdated: Date.now() }, { upsert: true });
                await InventoryHistory.create({
                    productId: product._id,
                    type: 'IN',
                    quantity: restoration,
                    reason: reason || `Order Adjustment (#${order._id})`,
                    orderId: order._id
                });
            }
        }
    }
};

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

        // 1. Validate stock ONLY for POS/Direct Sales (Walk-in customers)
        // Standard and Website orders bypass this because they are made-to-order.
        /*
        if (orderData.type === 'DirectSale') {
            for (const item of orderData.items) {
                const product = await Product.findOne({ pName: item.pName }).populate('recipe.ingredientId');
                if (product) {
                    // Check ingredients stock
                    if (product.recipe && product.recipe.length > 0) {
                        for (const ing of product.recipe) {
                            const ingredient = ing.ingredientId;
                            const neededQty = (ing.quantity || 0) * (item.quantity || 1);
                            if ((ingredient.stock || 0) < neededQty) {
                                throw new Error(`Not enough stock for ingredient: ${ingredient.pName}`);
                            }
                        }
                    } else {
                        // Check direct product stock
                        if ((product.stock || 0) < item.quantity) {
                            throw new Error(`Not enough stock for ${product.pName}`);
                        }
                    }
                }
            }
        }
        */

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

        // 3.5 Update registered User's phone and address profile
        if (req.user) {
            await User.findByIdAndUpdate(req.user._id, {
                $set: {
                    phone: order.phone,
                    address: order.address
                }
            });
        }

        // 4. Process items for inventory and stock reduction (for all orders)
        await processStockDeduction(order);

        res.status(201).json(order);

    } catch (error) {
        console.error("Order creation error:", error);
        res.status(400).json({ message: error.message });
    }
};



// GET ALL ORDERS
export const getOrders = async (req, res) => {
    try {
        const { customerName, status, date, type } = req.query;
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

        if (type) {
            query.type = type;
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

        // Block transition to Delivered if not paid
        if (req.body.orderStatus === 'Delivered' && oldOrder.paymentStatus !== 'Paid') {
            return res.status(400).json({ 
                message: 'Payment Pending: Full settlement is required before marking this order as Delivered.',
                requirePayment: true
            });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        //  If order cancelled → restore stock
        if (req.body.orderStatus === 'Cancelled' && oldOrder.orderStatus !== 'Cancelled') {
            for (const item of order.items) {
                const product = await Product.findOne({ pName: item.pName }).populate('recipe.ingredientId');

                if (product) {
                    if (product.recipe && product.recipe.length > 0) {
                        // Restore ingredients
                        for (const ing of product.recipe) {
                            const ingredient = ing.ingredientId;
                            const restoration = ing.quantity * item.quantity;
                            const newStock = ingredient.stock + restoration;
                            const newStatus = newStock === 0 ? "Out of Stock" : (newStock < 5 ? "Low Stock" : "In Stock");

                            await Product.findByIdAndUpdate(ingredient._id, {
                                $set: { stock: newStock, stockStatus: newStatus }
                            });

                            await Inventory.findOneAndUpdate(
                                { productId: ingredient._id },
                                { quantity: newStock, lastUpdated: Date.now() },
                                { upsert: true }
                            );

                            await InventoryHistory.create({
                                productId: ingredient._id,
                                type: 'IN',
                                quantity: restoration,
                                reason: `Order Cancelled (#${order._id}) - Ingredient Returned`,
                                orderId: order._id
                            });
                        }
                    } else {
                        // Restore direct product
                        const newStock = product.stock + item.quantity;
                        const newStatus = newStock === 0 ? "Out of Stock" : (newStock < 5 ? "Low Stock" : "In Stock");

                        await Product.findByIdAndUpdate(product._id, {
                            $set: { stock: newStock, stockStatus: newStatus }
                        });

                        await Inventory.findOneAndUpdate(
                            { productId: product._id },
                            { quantity: newStock, lastUpdated: Date.now() },
                            { upsert: true }
                        );

                        await InventoryHistory.create({
                            productId: product._id,
                            type: 'IN',
                            quantity: item.quantity,
                            reason: `Order Cancelled (#${order._id}) - Product Returned`,
                            orderId: order._id
                        });
                    }
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

        // Block transition to Delivered if not paid
        if (newStatus === 'Delivered' && oldOrder.paymentStatus !== 'Paid') {
            return res.status(400).json({ 
                message: 'Payment Pending: Full settlement is required before marking this order as Delivered.',
                requirePayment: true
            });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { orderStatus: newStatus },
            { new: true }
        );

        // --- REFINED STOCK LOGIC ---

        // 1. If moving TO 'Cancelled' from any active status -> Restore Stock
        if (newStatus === 'Cancelled' && oldStatus !== 'Cancelled') {
            await processStockRestoration(order, `Status -> Cancelled (#${order._id})`);
        } 
        // 2. If moving FROM 'Cancelled' back to any active status -> Validate and Deduct Stock
        else if (oldStatus === 'Cancelled' && newStatus !== 'Cancelled') {
            // Validate stock first
            for (const item of order.items) {
                const product = await Product.findOne({ pName: item.pName }).populate('recipe.ingredientId');
                if (product) {
                    if (product.recipe && product.recipe.length > 0) {
                        for (const ing of product.recipe) {
                            if (ing.ingredientId.stock < (ing.quantity * item.quantity)) {
                                await Order.findByIdAndUpdate(req.params.id, { orderStatus: oldStatus });
                                throw new Error(`Insufficient stock for ingredient: ${ing.ingredientId.pName}`);
                            }
                        }
                    } else if (product.stock < item.quantity) {
                        await Order.findByIdAndUpdate(req.params.id, { orderStatus: oldStatus });
                        throw new Error(`Insufficient stock for product: ${product.pName}`);
                    }
                }
            }
            await processStockDeduction(order);
        }

        res.json(order);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};



// UPDATE PAYMENT STATUS
export const updatePaymentStatus = async (req, res) => {
    try {
        const { paymentStatus } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { paymentStatus },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
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

// GET ORDERS FOR LOGGED IN CUSTOMER
export const getCustomerOrders = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const orders = await Order.find({ createdBy: req.user._id })
            .sort({ createdAt: -1 });
            
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching customer orders:", error);
        res.status(500).json({ message: 'Failed to fetch your orders' });
    }
};