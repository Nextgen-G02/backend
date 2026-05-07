import CashDrawer from '../../models/CashDrawer.js';
import Order from '../../models/order.model.js';
import Expense from '../../models/Expense.js';

const syncDrawerData = async (drawer) => {
    const date = new Date(drawer.date);
    date.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const salesAggregate = await Order.aggregate([
        {
            $match: {
                paymentStatus: 'Paid',
                createdAt: { $gte: date, $lte: endOfDay }
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
                date: { $gte: date, $lte: endOfDay }
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
    drawer.closingBalance = drawer.openingBalance + drawer.salesCash - drawer.expensesCash - (drawer.withdrawals || 0);
    
    if (drawer.status === 'Closed') {
        drawer.difference = (drawer.actualBalance || 0) - drawer.closingBalance;
    }

    return drawer;
};

export const getTodayDrawer = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let drawer = await CashDrawer.findOne({ date: today });

        if (!drawer) {
            return res.status(200).json({ success: true, data: null });
        }

        await syncDrawerData(drawer);
        // We don't necessarily need to save on every GET, 
        // but it helps keep history in sync if we do.
        await drawer.save();

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

        drawer.actualBalance = actualBalance;
        drawer.status = 'Closed';
        drawer.notes = notes;

        await syncDrawerData(drawer);
        await drawer.save();
        
        res.status(200).json({ success: true, data: drawer });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getDrawerHistory = async (req, res) => {
    try {
        const history = await CashDrawer.find().sort({ date: -1 }).limit(30);
        
        // Sync open drawers in history to show live data
        const syncedHistory = await Promise.all(history.map(async (item) => {
            if (item.status === 'Open') {
                return await syncDrawerData(item);
            }
            return item;
        }));

        res.status(200).json({ success: true, data: syncedHistory });
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
        if (actualBalance !== undefined) drawer.actualBalance = actualBalance;
        if (notes !== undefined) drawer.notes = notes;

        await syncDrawerData(drawer);
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

export const withdrawFromDrawer = async (req, res) => {
    try {
        const { amount, reason } = req.body;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let drawer = await CashDrawer.findOne({ date: today });
        if (!drawer || drawer.status === 'Closed') {
            return res.status(400).json({ success: false, message: 'Drawer is not open' });
        }

        drawer.withdrawals = (drawer.withdrawals || 0) + parseFloat(amount);
        drawer.notes = (drawer.notes ? drawer.notes + ' | ' : '') + `Withdrawal: Rs.${amount} (${reason || 'No reason'})`;
        
        await syncDrawerData(drawer);
        await drawer.save();
        res.status(200).json({ success: true, data: drawer });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
