const mongoose = require('mongoose');

const inventoryHistorySchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    type: { type: String, enum: ['IN', 'OUT'], required: true },
    quantity: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    reason: { type: String }
});

module.exports = mongoose.model('InventoryHistory', inventoryHistorySchema);
// inventory history model to track stock adjustments and reasons
