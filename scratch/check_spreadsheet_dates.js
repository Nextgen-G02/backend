import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/order.model.js';
import Purchase from '../models/Purchase.js';
import Expense from '../models/Expense.js';

dotenv.config();

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

async function checkDateFinancials(dateStr) {
    try {
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
        console.log(`Total Revenue: Rs. ${revenue}`);
        console.log(`Purchase Costs: Rs. ${purchaseCost}`);
        console.log(`Other Expenses: Rs. ${expenseCost}`);
        console.log(`Net Profit: Rs. ${netProfit}`);
        console.log("-----------------------------------");
    } catch (error) {
        console.error(error);
    }
}

async function run() {
    console.log("Connecting to:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    await checkDateFinancials('2026-07-03');
    await checkDateFinancials('2026-07-04');

    await mongoose.disconnect();
    console.log("Disconnected");
}

run();
