// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import Product from "../models/product.js";

// dotenv.config();

// const MONGO_URL = process.env.MONGODB_URL;

// const products = [
//   {
//     productId: "P001",
//     pName: "Black Forest Cake",
//     pCategory: "cake",
//     description: "Classic chocolate sponge with cherries and whipped cream",
//     pImg: ["https://images.unsplash.com/photo-1601979031925-424e53b6caaa"],
//     weight: 1,
//     price: 1200,
//     stock: 10,
//   },
//   {
//     productId: "P002",
//     pName: "Chocolate Truffle Cake",
//     pCategory: "cake",
//     description: "Rich chocolate layers with smooth ganache",
//     pImg: ["https://images.unsplash.com/photo-1578985545062-69928b1d9587"],
//     weight: 1,
//     price: 950,
//     stock: 8,
//   },
//   {
//     productId: "P003",
//     pName: "Red Velvet Cake",
//     pCategory: "cake",
//     description: "Soft red sponge with cream cheese frosting",
//     pImg: ["https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7"],
//     weight: 1,
//     price: 1000,
//     stock: 6,
//   },
//   {
//     productId: "P004",
//     pName: "Strawberry Cake",
//     pCategory: "cake",
//     description: "Fresh strawberry cream cake",
//     pImg: ["https://images.unsplash.com/photo-1563729784474-d77dbb933a9e"],
//     weight: 1,
//     price: 850,
//     stock: 12,
//   },
//   {
//     productId: "P005",
//     pName: "Vanilla Butter Cake",
//     pCategory: "cake",
//     description: "Classic vanilla sponge with buttercream",
//     pImg: ["https://images.unsplash.com/photo-1605478371310-a9f1e96b4ff4"],
//     weight: 1,
//     price: 700,
//     stock: 15,
//   },

//   // 🎂 ADD MORE (short format)
//   ...Array.from({ length: 25 }).map((_, i) => ({
//     productId: `P${(i + 6).toString().padStart(3, "0")}`,
//     pName: [
//       "Chocolate Cake",
//       "Fruit Cake",
//       "Butter Cake",
//       "Coffee Cake",
//       "Caramel Cake",
//     ][i % 5] + " " + (i + 1),

//     pCategory: ["cake", "pastry", "cupcake"][i % 3],

//     description: "Delicious freshly baked cake item",

//     pImg: [
//       [
//         "https://images.unsplash.com/photo-1606313564200-e75d5e30476c",
//         "https://images.unsplash.com/photo-1571115764595-644a1f56a55c",
//         "https://images.unsplash.com/photo-1587241321921-91a834d6d191",
//       ][i % 3],
//     ],

//     weight: 0.5 + (i % 2),
//     price: 500 + i * 20,
//     stock: 5 + (i % 10),
//     stockStatus: "In Stock",
//   })),
// ];

// const seedData = async () => {
//   try {
//     await mongoose.connect(MONGO_URL);
//     console.log("MongoDB Connected");

//     await Product.deleteMany();
//     console.log("Old products deleted");

//     await Product.insertMany(products);
//     console.log("30 Products inserted ✅");

//     process.exit();
//   } catch (error) {
//     console.error(error);
//     process.exit(1);
//   }
// };

// seedData();