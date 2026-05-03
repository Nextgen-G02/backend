import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unitPrice: {
    type: Number,
    required: true,
    default: 0
  },
  cost: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    required: true,
    default: 0
  },
  balance: {
    type: Number,
    required: true,
    default: 0
  },
  appliedCredit: {
    type: Number,
    default: 0
  },
  paymentHistory: [
    {
      amount: Number,
      date: { type: Date, default: Date.now }
    }
  ],
  supplyDate: {
    type: Date,
    default: Date.now
  }
});

const Purchase = mongoose.model("Purchase", purchaseSchema);
export default Purchase;