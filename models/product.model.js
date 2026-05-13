import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    unique: true
  },
  pName: {
    type: String,
    required: true,
  },

  pCategory: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  images: [
    {
      type: String
    }
  ],

  weight: {
    type: Number,
    required: false
  },

  price: {
    type: Number,
    required: true,
    min: [0.01, 'Price must be greater than 0']
  },

  costPrice: {
    type: Number,
    required: true,
    min: [0.01, 'Cost price must be greater than 0'],
    default: 0
  },

  stock: {
    type: Number,
    required: true,
    min: [0, 'Stock cannot be negative']
  },

  expiryDate: {
    type: Date
  },

  unit: {
    type: String,
    required: true,
    default: 'pcs'
  },

  // status: {
  //   type: String,
  //   enum: ["Active", "Inactive"],
  //   default: "Active"
  // },

  stockStatus: {
    type: String,
    enum: ["In Stock", "Out of Stock", "Low Stock"],
    default: "In Stock"
  },

  // Customization Fields
  isCustomizable: {
    type: Boolean,
    default: false
  },
  flavors: [
    {
      type: String
    }
  ],
  weightOptions: [
    {
      weight: Number,
      priceMultiplier: { type: Number, default: 1 }
    }
  ],
  isIngredient: {
    type: Boolean,
    default: false
  },
  recipe: [
    {
      ingredientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
      },
      quantity: {
        type: Number,
        required: true
      }
    }
  ]
},

);

const Product = mongoose.model("Product", productSchema);

export default Product;