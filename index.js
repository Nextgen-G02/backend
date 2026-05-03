import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']); // dont remove this


import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import app from './app.js';


const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URL;

if (!MONGO_URI) {
    console.error("MONGO_URI missing");
    process.exit(1);
}

const startServer = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        // Drop unique index on email for suppliers if it exists
        try {
            await mongoose.connection.collection('suppliers').dropIndex('email_1');
            console.log("Dropped unique email index from suppliers");
        } catch (err) {
            // Index likely doesn't exist or already dropped
        }

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();