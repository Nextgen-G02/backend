import express from 'express';
const router = express.Router();
import * as orderController from '../Controllers/orderController.js';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';



// CREATE ORDER
export const createOrder = async (req, res) => {
    try {
        const orderData = { ...req.body };

        if (req.user) {
            orderData.createdBy = req.user._id;
        }

        //  Default values for DirectSale
        if (orderData.type === 'DirectSale') {
            orderData.orderStatus = 'Delivered';
            orderData.paymentStatus = 'Paid';
        }

        const order = new Order(orderData);
        await order.save();

        //  FIXED: use item.pName (NOT productName)
        for (const item of order.items) {
            const product = await Product.findOne({
                pName: item.pName   //  CHANGED HERE
            });

            //  NEW: product existence check
            if (!product) {
                throw new Error(`Product not found: ${item.pName}`);
            }

            //  NEW: stock validation
            if (product.stock < item.quantity) {
                throw new Error(`Not enough stock for ${product.pName}`);
            }

            //  Reduce stock
            product.stock -= item.quantity;
            await product.save();
        }

        res.status(201).json(order);

    } catch (error) {
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
                    product.stock += item.quantity;  // restore stock
                    await product.save();
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
        const oldOrder = await Order.findById(req.params.id);

        if (!oldOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { orderStatus: req.body.orderStatus },
            { new: true }
        );

        //  If status changed to Cancelled → restore stock
        if (req.body.orderStatus === 'Cancelled' && oldOrder.orderStatus !== 'Cancelled') {

            for (const item of order.items) {

                const product = await Product.findOne({
                    pName: item.pName   // CHANGED HERE
                });

                if (product) {
                    product.stock += item.quantity;
                    await product.save();
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


