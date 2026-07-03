import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/product.model.js';
import SystemAlert from '../models/SystemAlert.js';

dotenv.config();

const debug = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pos');
    console.log("Connected to MongoDB");

    const lowStockProducts = await Product.find({ stock: { $lt: 5 } });
    console.log(`\nLow stock products (< 5) count: ${lowStockProducts.length}`);
    lowStockProducts.forEach(p => {
      console.log(`- ${p.pName} (ID: ${p._id}, Category: ${p.pCategory}, Stock: ${p.stock})`);
    });

    const alerts = await SystemAlert.find({});
    console.log(`\nTotal Alerts in DB: ${alerts.length}`);
    alerts.forEach(a => {
      console.log(`- [${a.type}] Product: ${a.productName}, Msg: ${a.message}, Read: ${a.read}, Date: ${a.createdAt}`);
    });

    await mongoose.disconnect();
    console.log("\nDisconnected");
  } catch (err) {
    console.error(err);
  }
};

debug();
