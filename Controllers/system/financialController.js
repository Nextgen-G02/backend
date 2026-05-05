import Sale from '../../models/Sale.js';
import Purchase from '../../models/Purchase.js';
import Order from '../../models/order.model.js';
import Expense from '../../models/Expense.js';

export const getFinancialSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateQuery = {};

        const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
        const end = endDate ? new Date(endDate) : new Date(new Date().setHours(23, 59, 59, 999));
        
        if (endDate) end.setHours(23, 59, 59, 999);

        // Aggregate Gross Yield (Revenue from Paid Orders)
        const revenueAggregate = await Order.aggregate([
            { 
                $match: { 
                    paymentStatus: 'Paid',
                    createdAt: { $gte: start, $lte: end }
                } 
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmount" },
                    count: { $sum: 1 }
                }
            }
        ]);

        const grossYield = revenueAggregate.length > 0 ? revenueAggregate[0].totalRevenue : 0;
        const orderCount = revenueAggregate.length > 0 ? revenueAggregate[0].count : 0;

        // Aggregate Ops Burn (Expenses from Purchases)
        const purchaseAggregate = await Purchase.aggregate([
            {
                $match: {
                    supplyDate: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: null,
                    totalExpenses: { $sum: "$cost" }
                }
            }
        ]);

        const opsBurn = purchaseAggregate.length > 0 ? purchaseAggregate[0].totalExpenses : 0;

        // Aggregate Manual Expenses (Salaries, Rent, Utilities, etc.)
        const manualExpensesAggregate = await Expense.aggregate([
            {
                $match: {
                    date: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: "$category",
                    total: { $sum: "$amount" }
                }
            }
        ]);

        const expenseBreakdown = {
            Ingredients: 0,
            Salaries: 0,
            'Shop Bills': 0,
            Other: 0
        };

        let totalManualExpenses = 0;
        manualExpensesAggregate.forEach(item => {
            expenseBreakdown[item._id] = item.total;
            totalManualExpenses += item.total;
        });

        // Calculate Net Retained
        const totalExpenses = opsBurn + totalManualExpenses;
        const netRetained = grossYield - totalExpenses;

        res.status(200).json({
            success: true,
            data: {
                grossYield,
                opsBurn,
                totalManualExpenses,
                expenseBreakdown,
                totalExpenses,
                netRetained,
                orderCount
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getDailyRevenue = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = { paymentStatus: 'Paid' };

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.createdAt = { $gte: start, $lte: end };
        }

        const dailyRevenue = await Order.aggregate([
            { $match: query },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$totalAmount" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({ success: true, data: dailyRevenue });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMonthlyRevenue = async (req, res) => {
    try {
        const { year } = req.query;
        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        
        const startDate = new Date(`${targetYear}-01-01`);
        const endDate = new Date(`${targetYear}-12-31T23:59:59.999Z`);

        const monthlyRevenue = await Order.aggregate([
            { 
                $match: { 
                    paymentStatus: 'Paid',
                    createdAt: { $gte: startDate, $lte: endDate }
                } 
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    revenue: { $sum: "$totalAmount" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({ success: true, data: monthlyRevenue });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};