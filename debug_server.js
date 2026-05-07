import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URL;

async function run() {
    console.log("Connecting to:", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("Connected!");
    
    const Product = mongoose.model("Product", new mongoose.Schema({}, { strict: false }));
    console.log("Fetching 1 product...");
    const p = await Product.findOne({}).lean();
    console.log("Result:", p ? p.pName : "No products found");
    process.exit(0);
}

run().catch(err => {
    console.error("DEBUG FAILED:", err);
    process.exit(1);
});
