
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: './.env' });

import Product from './models/product.model.js';
import Expense from './models/Expense.js';

async function audit() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const utilsCount = await Expense.countDocuments({ category: 'Utilities' });
        console.log('Utilities records count:', utilsCount);

        const zeroCostProducts = await Product.countDocuments({ 
            $or: [
                { costPrice: { $exists: false } },
                { costPrice: 0 },
                { costPrice: null }
            ]
        });
        console.log('Products with 0 or missing costPrice:', zeroCostProducts);

        if (utilsCount > 0) {
            console.log('Migrating Utilities to Shop Bills...');
            const res = await Expense.updateMany({ category: 'Utilities' }, { category: 'Shop Bills' });
            console.log(`Migration complete. Updated ${res.modifiedCount} records.`);
        }

        const sampleProducts = await Product.find({ costPrice: { $gt: 0 } }).limit(3);
        console.log('Sample products with cost price:', sampleProducts.map(p => ({ name: p.pName, cost: p.costPrice })));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

audit();
