import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Purchase from './models/Purchase.js';

dotenv.config();

async function checkPurchases() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const purchases = await Purchase.find().sort({ supplyDate: -1 }).limit(5);
        console.log('Latest 5 Purchases:');
        console.log(JSON.stringify(purchases, null, 2));

        const total = await Purchase.countDocuments();
        console.log(`Total Purchase Records: ${total}`);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkPurchases();
