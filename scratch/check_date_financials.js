import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './backend/models/order.model.js';
import Purchase from './backend/models/Purchase.js';
import Expense from './backend/models/Expense.js';

dotenv.config({ path: './backend/.env' });

async function checkDateFinancials(dateStr) {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const start = new Date(dateStr);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateStr);
        end.setHours(23, 59, 59, 999);

        console.log(`Checking financials for ${dateStr}...`);

        // Orders
        const orders = await Order.find({
            paymentStatus: 'Paid',
            createdAt: { $gte: start, $lte: end }
        });
        const revenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

        // Purchases
        const purchases = await Purchase.find({
            supplyDate: { $gte: start, $lte: end }
        });
        const purchaseCost = purchases.reduce((sum, p) => sum + p.cost, 0);

        // Expenses
        const expenses = await Expense.find({
            date: { $gte: start, $lte: end }
        });
        const expenseCost = expenses.reduce((sum, e) => sum + e.amount, 0);

        const netProfit = revenue - (purchaseCost + expenseCost);

        console.log("-----------------------------------");
        console.log(`Date: ${dateStr}`);
        console.log(`Total Orders (Paid): ${orders.length}`);
        console.log(`Total Revenue: Rs. ${revenue.toLocaleString()}`);
        console.log(`Purchase Costs: Rs. ${purchaseCost.toLocaleString()}`);
        console.log(`Other Expenses: Rs. ${expenseCost.toLocaleString()}`);
        console.log(`Net Profit: Rs. ${netProfit.toLocaleString()}`);
        console.log("-----------------------------------");

        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}

checkDateFinancials('2026-04-24');
