// import dns from 'dns';
// dns.setServers(['8.8.8.8', '8.8.4.4']); // dont remove this 
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import app from './app.js';

<<<<<<< HEAD
const PORT = process.env.PORT || 5000;
const MONGODB_URL = process.env.MONGODB_URL;
const JWT_SECRET = process.env.JWT_SECRET;
=======
>>>>>>> 26fcbcb23a943d5298f0f05dcf9a50814e6bb061

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("MONGO_URI missing");
    process.exit(1);
}

if (!JWT_SECRET) {
    console.error("JWT_SECRET missing");
    process.exit(1);
}

const startServer = async () => {
    try {
        await mongoose.connect(MONGO_URI);
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


