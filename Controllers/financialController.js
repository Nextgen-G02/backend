import Sale from '../models/Sale.js';
import Purchase from '../models/Purchase.js';
import Order from '../models/order.model.js';

export const getFinancialSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateQuery = {};

        if (startDate && endDate) {
            dateQuery = { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } };
        }

        // Aggregate Sales Revenue
        const orders = await Order.find({ ...dateQuery, paymentStatus: 'Paid' });
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

        // Aggregate Expenses (Purchases)
        const purchases = await Purchase.find({ 
            date: { $gte: new Date(startDate || 0), $lte: new Date(endDate || Date.now()) } 
        });
        const totalExpenses = purchases.reduce((sum, p) => sum + p.totalCost, 0);

        const totalProfit = totalRevenue - totalExpenses;

        res.status(200).json({
            success: true,
            data: {
                totalRevenue,
                totalExpenses,
                totalProfit,
                orderCount: orders.length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
