import mongoose from 'mongoose';

const cashDrawerSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true,
        default: () => new Date().setHours(0, 0, 0, 0)
    },
    openingBalance: {
        type: Number,
        default: 0
    },
    salesCash: {
        type: Number,
        default: 0
    },
    expensesCash: {
        type: Number,
        default: 0
    },
    withdrawals: {
        type: Number,
        default: 0
    },
    closingBalance: {
        type: Number,
        default: 0
    },
    actualBalance: {
        type: Number,
        default: 0
    },
    difference: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Open', 'Closed'],
        default: 'Open'
    },
    notes: {
        type: String
    }
}, { timestamps: true });

const CashDrawer = mongoose.model('CashDrawer', cashDrawerSchema);
export default CashDrawer;
