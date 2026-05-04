import Order from '../../models/order.model.js';
import Product from '../../models/product.model.js';
import Inventory from '../../models/Inventory.js';
import Customer from '../../models/customer.model.js';
import InventoryHistory from '../../models/InventoryHistory.js';





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
            const product = await Product.findOne({ pName: item.pName }).populate('recipe.ingredientId');
            if (product) {
                // Check ingredients stock
                if (product.recipe && product.recipe.length > 0) {
                    for (const ing of product.recipe) {
                        const ingredient = ing.ingredientId;
                        const neededQty = ing.quantity * item.quantity;
                        if (ingredient.stock < neededQty) {
                            throw new Error(`Not enough stock for ingredient: ${ingredient.pName}`);
                        }
                    }
                } else {
                    // Check direct product stock
                    if (product.stock < item.quantity) {
                        throw new Error(`Not enough stock for ${product.pName}`);
                    }
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
            const product = await Product.findOne({ pName: item.pName }).populate('recipe.ingredientId');

            if (product) {
                if (product.recipe && product.recipe.length > 0) {
                    // Deduct ingredients
                    for (const ing of product.recipe) {
                        const ingredient = ing.ingredientId;
                        const deduction = ing.quantity * item.quantity;
                        
                        const newStock = ingredient.stock - deduction;
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
                            type: 'OUT',
                            quantity: deduction,
                            reason: `Sold in ${product.pName} (Order #${order._id})`,
                            orderId: order._id
                        });
                    }
                } else {
                    // Deduct direct product
                    const newStock = product.stock - item.quantity;
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
                        type: 'OUT',
                        quantity: item.quantity,
                        reason: `Direct Sale (Order #${order._id})`,
                        orderId: order._id
                    });
                }
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

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { orderStatus: newStatus },
            { new: true }
        );

        // --- STOCK LOGIC ---

        // 1. If moving TO 'Cancelled' from any other state -> Restore Stock
        if (newStatus === 'Cancelled' && oldStatus !== 'Cancelled') {
            for (const item of order.items) {
                const product = await Product.findOne({ pName: item.pName }).populate('recipe.ingredientId');
                if (product) {
                    if (product.recipe && product.recipe.length > 0) {
                        for (const ing of product.recipe) {
                            const ingredient = ing.ingredientId;
                            const restoration = ing.quantity * item.quantity;
                            const newStock = ingredient.stock + restoration;
                            const newStatusVal = newStock === 0 ? "Out of Stock" : (newStock < 5 ? "Low Stock" : "In Stock");

                            await Product.findByIdAndUpdate(ingredient._id, { $set: { stock: newStock, stockStatus: newStatusVal } });
                            await Inventory.findOneAndUpdate({ productId: ingredient._id }, { quantity: newStock, lastUpdated: Date.now() }, { upsert: true });
                            await InventoryHistory.create({
                                productId: ingredient._id,
                                type: 'IN',
                                quantity: restoration,
                                reason: `Status -> Cancelled (#${order._id})`,
                                orderId: order._id
                            });
                        }
                    } else {
                        const newStock = product.stock + item.quantity;
                        const newStatusVal = newStock === 0 ? "Out of Stock" : (newStock < 5 ? "Low Stock" : "In Stock");
                        await Product.findByIdAndUpdate(product._id, { $set: { stock: newStock, stockStatus: newStatusVal } });
                        await Inventory.findOneAndUpdate({ productId: product._id }, { quantity: newStock, lastUpdated: Date.now() }, { upsert: true });
                        await InventoryHistory.create({
                            productId: product._id,
                            type: 'IN',
                            quantity: item.quantity,
                            reason: `Status -> Cancelled (#${order._id})`,
                            orderId: order._id
                        });
                    }
                }
            }
        } 
        // 2. If moving FROM 'Cancelled' to any other state -> Reduce Stock
        else if (oldStatus === 'Cancelled' && newStatus !== 'Cancelled') {
            for (const item of order.items) {
                const product = await Product.findOne({ pName: item.pName }).populate('recipe.ingredientId');
                if (product) {
                    if (product.recipe && product.recipe.length > 0) {
                        // Check ingredient stock
                        for (const ing of product.recipe) {
                            const needed = ing.quantity * item.quantity;
                            if (ing.ingredientId.stock < needed) {
                                await Order.findByIdAndUpdate(req.params.id, { orderStatus: oldStatus });
                                throw new Error(`Insufficient stock for ingredient: ${ing.ingredientId.pName}`);
                            }
                        }
                        // Deduct ingredients
                        for (const ing of product.recipe) {
                            const ingredient = ing.ingredientId;
                            const deduction = ing.quantity * item.quantity;
                            const newStock = ingredient.stock - deduction;
                            const newStatusVal = newStock === 0 ? "Out of Stock" : (newStock < 5 ? "Low Stock" : "In Stock");

                            await Product.findByIdAndUpdate(ingredient._id, { $set: { stock: newStock, stockStatus: newStatusVal } });
                            await Inventory.findOneAndUpdate({ productId: ingredient._id }, { quantity: newStock, lastUpdated: Date.now() }, { upsert: true });
                            await InventoryHistory.create({
                                productId: ingredient._id,
                                type: 'OUT',
                                quantity: deduction,
                                reason: `Status Cancelled -> ${newStatus} (#${order._id})`,
                                orderId: order._id
                            });
                        }
                    } else {
                        if (product.stock < item.quantity) {
                            await Order.findByIdAndUpdate(req.params.id, { orderStatus: oldStatus });
                            throw new Error(`Insufficient stock for ${product.pName}`);
                        }
                        const newStock = product.stock - item.quantity;
                        const newStatusVal = newStock === 0 ? "Out of Stock" : (newStock < 5 ? "Low Stock" : "In Stock");
                        await Product.findByIdAndUpdate(product._id, { $set: { stock: newStock, stockStatus: newStatusVal } });
                        await Inventory.findOneAndUpdate({ productId: product._id }, { quantity: newStock, lastUpdated: Date.now() }, { upsert: true });
                        await InventoryHistory.create({
                            productId: product._id,
                            type: 'OUT',
                            quantity: item.quantity,
                            reason: `Status Cancelled -> ${newStatus} (#${order._id})`,
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