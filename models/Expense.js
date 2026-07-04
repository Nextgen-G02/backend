import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    category: {
        type: String,
        enum: ['Ingredients', 'Salaries', 'Current Bill', 'Water Bill', 'Other'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Non-Cash'],
        default: 'Cash'
    }
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
