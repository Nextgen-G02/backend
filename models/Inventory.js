import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  lowStockLevel: {
    type: Number,
    default: 10
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const Inventory = mongoose.model("Inventory", inventorySchema);
export default Inventory;