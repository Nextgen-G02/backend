import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../backend/.env') });

const expenseSchema = new mongoose.Schema({
    category: String,
    amount: Number,
    description: String,
    date: Date
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const result = await Expense.updateMany(
            { category: 'Utilities' },
            { $set: { category: 'Shop Bills' } }
        );

        console.log(`Migration complete. Updated ${result.modifiedCount} records.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
