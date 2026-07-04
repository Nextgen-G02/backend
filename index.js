import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']); // Activated to prevent resolution hangs on local networks


import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import app from './app.js';
import Expense from './models/Expense.js';


const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URL;


if (!MONGO_URI) {
    console.error("MONGO_URI missing");
    process.exit(1);
}

const startServer = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        // Drop unique index on email for suppliers if it exists
        try {
            await mongoose.connection.collection('suppliers').dropIndex('email_1');
            console.log("Dropped unique email index from suppliers");
        } catch (err) {
            // Index likely doesn't exist or already dropped
        }

        // Normalize existing expense dates to midnight for consistent sorting
        try {
            const expenses = await Expense.find();
            let count = 0;
            for (const exp of expenses) {
                const d = new Date(exp.date);
                if (d.getHours() !== 0 || d.getMinutes() !== 0 || d.getSeconds() !== 0 || d.getMilliseconds() !== 0) {
                    d.setHours(0, 0, 0, 0);
                    exp.date = d;
                    await exp.save();
                    count++;
                }
            }
            if (count > 0) {
                console.log(`Migration: Normalized ${count} existing expense dates to midnight.`);
            }
        } catch (err) {
            console.error("Failed to run expense date normalization migration:", err);
        }

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();