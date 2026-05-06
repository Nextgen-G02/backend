import CashDrawer from '../../models/CashDrawer.js';
import Order from '../../models/order.model.js';
import Expense from '../../models/Expense.js';

export const getTodayDrawer = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let drawer = await CashDrawer.findOne({ date: today });

        if (!drawer) {
            return res.status(200).json({ success: true, data: null });
        }

        // Calculate current sales and expenses for the day
        const salesAggregate = await Order.aggregate([
            {
                $match: {
                    paymentStatus: 'Paid',
                    createdAt: { $gte: today }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalAmount" }
                }
            }
        ]);

        const expensesAggregate = await Expense.aggregate([
            {
                $match: {
                    date: { $gte: today }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        drawer.salesCash = salesAggregate.length > 0 ? salesAggregate[0].total : 0;
        drawer.expensesCash = expensesAggregate.length > 0 ? expensesAggregate[0].total : 0;
        drawer.closingBalance = drawer.openingBalance + drawer.salesCash - drawer.expensesCash;

        // Don't save yet, just return the calculated view if it's still open
        // If it's closed, we use the saved values.

        res.status(200).json({ success: true, data: drawer });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const closeDrawer = async (req, res) => {
    try {
        const { actualBalance, notes } = req.body;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let drawer = await CashDrawer.findOne({ date: today });
        if (!drawer) {
            return res.status(404).json({ success: false, message: 'Drawer not found for today' });
        }

        // Recalculate everything to be sure
        const salesAggregate = await Order.aggregate([
            {
                $match: {
                    paymentStatus: 'Paid',
                    createdAt: { $gte: today }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalAmount" }
                }
            }
        ]);

        const expensesAggregate = await Expense.aggregate([
            {
                $match: {
                    date: { $gte: today }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        drawer.salesCash = salesAggregate.length > 0 ? salesAggregate[0].total : 0;
        drawer.expensesCash = expensesAggregate.length > 0 ? expensesAggregate[0].total : 0;
        drawer.closingBalance = drawer.openingBalance + drawer.salesCash - drawer.expensesCash;
        drawer.actualBalance = actualBalance;
        drawer.difference = actualBalance - drawer.closingBalance;
        drawer.status = 'Closed';
        drawer.notes = notes;

        await drawer.save();
        res.status(200).json({ success: true, data: drawer });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getDrawerHistory = async (req, res) => {
    try {
        const history = await CashDrawer.find().sort({ date: -1 }).limit(30);
        res.status(200).json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateDrawer = async (req, res) => {
    try {
        const { id } = req.params;
        const { actualBalance, notes, openingBalance } = req.body;

        const drawer = await CashDrawer.findById(id);
        if (!drawer) {
            return res.status(404).json({ success: false, message: 'Drawer record not found' });
        }

        if (openingBalance !== undefined) drawer.openingBalance = openingBalance;
        if (actualBalance !== undefined) {
            drawer.actualBalance = actualBalance;
            // Recalculate difference
            drawer.difference = actualBalance - drawer.closingBalance;
        }
        if (notes !== undefined) drawer.notes = notes;

        // Recalculate closing balance if openingBalance was changed
        drawer.closingBalance = drawer.openingBalance + drawer.salesCash - drawer.expensesCash;
        drawer.difference = drawer.actualBalance - drawer.closingBalance;

        await drawer.save();
        res.status(200).json({ success: true, data: drawer });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const openDrawer = async (req, res) => {
    try {
        const { openingBalance } = req.body;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existing = await CashDrawer.findOne({ date: today });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Drawer already open for today' });
        }

        const drawer = new CashDrawer({
            date: today,
            openingBalance: openingBalance || 0,
            status: 'Open'
        });

        await drawer.save();
        res.status(201).json({ success: true, data: drawer });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
