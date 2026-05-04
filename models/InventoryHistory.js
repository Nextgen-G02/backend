import mongoose from 'mongoose';

const inventoryHistorySchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    type: { type: String, enum: ['IN', 'OUT'], required: true },
    quantity: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    reason: { type: String },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }
});

const InventoryHistory = mongoose.model('InventoryHistory', inventoryHistorySchema);
export default InventoryHistory;
