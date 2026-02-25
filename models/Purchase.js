const mongoose = require("mongoose");

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

module.exports = mongoose.model("Purchase", purchaseSchema);