import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  quantityAdded: {
    type: Number,
    required: true
  },
  buyingPrice: {
    type: Number,
    required: true
  },
  totalCost: {
    type: Number,
    required: true
  },
  supplier: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const Purchase = mongoose.model("Purchase", purchaseSchema);
export default Purchase;