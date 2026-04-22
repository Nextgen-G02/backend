import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']); // dont remove this 

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import app from "./app.js";

const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGO_URL) {
  console.error("MONGO_URL missing in .env");
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error("JWT_SECRET missing in .env");
  process.exit(1);
}

const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URL);

    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();