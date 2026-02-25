import dotenv from 'dotenv';
dotenv.config();
import mongoose from  'mongoose';
import app from './app.js';


const PORT = process.env.PORT || 5000;
const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
    console.error("MONGODB_URL missing");
    process.exit(1);
}

const startServer = async () => {
    try {
        await mongoose.connect(MONGODB_URL);
        console.log("Connected to MongoDB");
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


