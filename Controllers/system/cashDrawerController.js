import CashDrawer from '../../models/CashDrawer.js';
import Order from '../../models/order.model.js';
import Expense from '../../models/Expense.js';

export const getTodayDrawer = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let drawer = await CashDrawer.findOne({ date: today });

        if (!drawer) {
            // If no drawer exists for today, try to find the previous day's closing balance
            const lastDrawer = await CashDrawer.findOne({ status: 'Closed' }).sort({ date: -1 });
            const openingBalance = lastDrawer ? lastDrawer.actualBalance : 0;

            drawer = new CashDrawer({
                date: today,
                openingBalance: openingBalance,
                status: 'Open'
            });
            await drawer.save();
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

export const updateDrawer = async (req, res) => {
    try {
        const { id } = req.params;
        const { openingBalance, actualBalance, notes } = req.body;
        
        const drawer = await CashDrawer.findById(id);
        if (!drawer) {
            return res.status(404).json({ success: false, message: 'Drawer not found' });
        }

        if (openingBalance !== undefined) drawer.openingBalance = openingBalance;
        if (actualBalance !== undefined) {
            drawer.actualBalance = actualBalance;
            drawer.difference = actualBalance - drawer.closingBalance;
        }
        if (notes !== undefined) drawer.notes = notes;

        // Recalculate closing balance if opening changed
        drawer.closingBalance = drawer.openingBalance + drawer.salesCash - drawer.expensesCash;
        if (drawer.status === 'Closed') {
            drawer.difference = drawer.actualBalance - drawer.closingBalance;
        }

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
