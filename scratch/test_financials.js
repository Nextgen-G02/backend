
import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "../models/order.model.js";
import Expense from "../models/Expense.js";
import Purchase from "../models/Purchase.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URL || "mongodb://localhost:27017/nirosha_sweet_house";

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        const startDate = "2026-07-04";
        const endDate = "2026-07-04";

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        console.log("Start Date:", start);
        console.log("End Date:", end);

        const orders = await Order.find({
            paymentStatus: "Paid",
            createdAt: { $gte: start, $lte: end }
        });
        console.log("Orders found:", orders.length);
        orders.forEach(o => console.log(`Order: ${o.totalAmount}, CreatedAt: ${o.createdAt}`));

        const purchases = await Purchase.find({
            supplyDate: { $gte: start, $lte: end }
        });
        console.log("Purchases found:", purchases.length);
        purchases.forEach(p => console.log(`Purchase: ${p.cost}, SupplyDate: ${p.supplyDate}`));

        const expenses = await Expense.find({
            date: { $gte: start, $lte: end }
        });
        console.log("Expenses found:", expenses.length);
        expenses.forEach(e => console.log(`Expense: ${e.amount}, Category: ${e.category}, Date: ${e.date}, CreatedAt: ${e.createdAt}`));

        const dailyRevenue = await Order.aggregate([
            { $match: { paymentStatus: "Paid", createdAt: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$totalAmount" },
                    orders: { $sum: 1 }
                }
            }
        ]);
        console.log("Daily Revenue Aggregation:", dailyRevenue);

        const dailyPurchases = await Purchase.aggregate([
            { $match: { supplyDate: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$supplyDate" } },
                    cost: { $sum: "$cost" }
                }
            }
        ]);
        console.log("Daily Purchases Aggregation:", dailyPurchases);

        const dailyExpenses = await Expense.aggregate([
            { $match: { date: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    amount: { $sum: "$amount" }
                }
            }
        ]);
        console.log("Daily Expenses Aggregation:", dailyExpenses);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();

