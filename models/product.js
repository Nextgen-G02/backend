import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    productId:{
        type: String,
        // required: true,
        // unique: true
    },
    pName:{
        type: String,
        required: true,
    },

     pCategory: {
      type: String, 
      // ref: 'Category',
      required: true
    },

    description: {
      type: String,
      required: true
    },

    pImg: [
      {
        type: String
      }
    ],

    weight: {
      type: Number,   
      required: true
    },

    expiryDate: { 
      type: Date 
    },

    price: {
      type: Number,
      required: true
    },

    BuyPrice: { 
      type: Number, 
      default:0
    },

    stock: {
      type: Number,
      required: true
    },

    stockStatus: {
      type: String,
      enum: ["In Stock", "Out of Stock", "Low Stock"],
      default: "In Stock"
    }
},

);

// const Product = mongoose.model("Product", productSchema);
const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
