const orderSchema = new mongoose.Schema({
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  orderItems: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
      },
      name: String,
      quantity: {
        type: Number,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      total: Number
    }
  ],

  shippingAddress: {
    street: String,
    city: String,
    district: String,
    postalCode: String,
    country: String
  },

  paymentMethod: {
    type: String,
    enum: ["COD", "Card", "PayPal"],
    required: true
  },

  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed"],
    default: "Pending"
  },

  orderStatus: {
    type: String,
    enum: [
      "Pending",
      "Confirmed",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled"
    ],
    default: "Pending"
  },

  itemsPrice: Number,
  taxPrice: Number,
  shippingPrice: Number,
  totalPrice: Number,

  isDelivered: {
    type: Boolean,
    default: false
  },

  deliveredAt: Date,

  paidAt: Date

}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
