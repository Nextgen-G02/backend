import mongoose from "mongoose";

const systemAlertSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["Low Stock", "Out of Stock"],
    default: "Low Stock"
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const SystemAlert = mongoose.model("SystemAlert", systemAlertSchema);
export default SystemAlert;
