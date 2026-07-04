import Sale from '../../models/Sale.js';
import Purchase from '../../models/Purchase.js';
import Order from '../../models/order.model.js';
import Expense from '../../models/Expense.js';

export const getFinancialSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate) : new Date();
        start.setHours(0, 0, 0, 0);

        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);
        
        // 1. Gross Yield (Revenue from Paid Orders)
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
                    total: { $sum: "$totalAmount" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // 2. Purchase cost (Operational Burn from Purchases)
        const purchaseAggregate = await Purchase.aggregate([
            {
                $match: {
                    supplyDate: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: null,
                    totalCost: { $sum: "$cost" }
                }
            }
        ]);

        // 3. Manual Expenses (Aggregated from Expense Collection)
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

        // Calculations
        const grossYield = revenueAggregate.length > 0 ? revenueAggregate[0].total : 0;
        const orderCount = revenueAggregate.length > 0 ? revenueAggregate[0].count : 0;
        const opsBurn = purchaseAggregate.length > 0 ? purchaseAggregate[0].totalCost : 0;

        const expenseBreakdown = {
            Ingredients: 0,
            Salaries: 0,
            'Current Bill': 0,
            'Water Bill': 0,
            Other: 0
        };

        let totalManualExpenses = 0;
        manualExpensesAggregate.forEach(item => {
            expenseBreakdown[item._id] = item.total;
            totalManualExpenses += item.total;
        });

        
       /* expenseBreakdown['Ingredients'] = (expenseBreakdown['Ingredients'] || 0) + opsBurn;
       */
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
        const purchaseQuery = {};
        const expenseQuery = {};

        let start = null;
        let end = null;
        if (startDate && endDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            
            query.createdAt = { $gte: start, $lte: end };
            purchaseQuery.supplyDate = { $gte: start, $lte: end };
            expenseQuery.date = { $gte: start, $lte: end };
        }

<<<<<<< HEAD
        const [dailyRevenue, dailyPurchases, dailyExpenses] = await Promise.all([
            Order.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        revenue: { $sum: "$totalAmount" },
                        orders: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            Purchase.aggregate([
                { $match: purchaseQuery },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$supplyDate" } },
                        cost: { $sum: "$cost" }
                    }
                }
            ]),
            Expense.aggregate([
                { $match: expenseQuery },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        amount: { $sum: "$amount" }
                    }
                }
            ])
        ]);

        const purchaseMap = {};
        dailyPurchases.forEach(p => {
            purchaseMap[p._id] = p.cost;
        });

        const expenseMap = {};
        dailyExpenses.forEach(e => {
            expenseMap[e._id] = e.amount;
        });

        const dailyData = dailyRevenue.map(day => {
            const dateStr = day._id;
            const cost = purchaseMap[dateStr] || 0;
            const expense = expenseMap[dateStr] || 0;
            return {
                ...day,
                profit: day.revenue - (cost + expense)
            };
        });

        res.status(200).json({ success: true, data: dailyData });
=======
        // 1. Group daily sales revenue
        const dailyRevenue = await Order.aggregate([
            { $match: query },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+05:30" } },
                    revenue: { $sum: "$totalAmount" },
                    orders: { $sum: 1 }
                }
            }
        ]);

        // 2. Group daily purchases cost
        const purchaseQuery = {};
        if (start && end) {
            purchaseQuery.supplyDate = { $gte: start, $lte: end };
        }
        const dailyPurchases = await Purchase.aggregate([
            { $match: purchaseQuery },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$supplyDate", timezone: "+05:30" } },
                    cost: { $sum: "$cost" }
                }
            }
        ]);

        // 3. Group daily expenses amount
        const expenseQuery = {};
        if (start && end) {
            expenseQuery.date = { $gte: start, $lte: end };
        }
        const dailyExpenses = await Expense.aggregate([
            { $match: expenseQuery },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "+05:30" } },
                    amount: { $sum: "$amount" }
                }
            }
        ]);

        // 4. Merge datasets by date
        const dateMap = {};

        dailyRevenue.forEach(item => {
            if (!dateMap[item._id]) {
                dateMap[item._id] = { date: item._id, revenue: 0, orders: 0, purchases: 0, expenses: 0 };
            }
            dateMap[item._id].revenue = item.revenue;
            dateMap[item._id].orders = item.orders;
        });

        dailyPurchases.forEach(item => {
            if (!dateMap[item._id]) {
                dateMap[item._id] = { date: item._id, revenue: 0, orders: 0, purchases: 0, expenses: 0 };
            }
            dateMap[item._id].purchases = item.cost;
        });

        dailyExpenses.forEach(item => {
            if (!dateMap[item._id]) {
                dateMap[item._id] = { date: item._id, revenue: 0, orders: 0, purchases: 0, expenses: 0 };
            }
            dateMap[item._id].expenses = item.amount;
        });

        // Calculate profit, filter out negative profit days, and sort by date ascending
        const mergedData = Object.values(dateMap)
            .map(item => {
                const profit = item.revenue - (item.purchases + item.expenses);
                return {
                    _id: item.date,
                    orders: item.orders,
                    revenue: item.revenue,
                    profit: profit
                };
            })
            .filter(item => item.profit >= 0)
            .sort((a, b) => a._id.localeCompare(b._id));

        res.status(200).json({ success: true, data: mergedData });
>>>>>>> 760ee9c1bc6d028bd7d91ab6763d700c744c043f
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
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "+05:30" } },
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