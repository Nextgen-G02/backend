import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    productId:{
        type: String,
        required: true,
        unique: true
    },
    pName:{
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
      required: true
    },

     price: {
      type: Number,
      required: true
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

const Product = mongoose.model("Product", productSchema);

export default Product;
