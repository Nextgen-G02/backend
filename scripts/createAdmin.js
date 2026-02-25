// import mongoose from "mongoose";
// import bcrypt from "bcrypt";
// import dotenv from "dotenv";
// import User from "../models/user.js";

// dotenv.config();

// const createAdmin = async () => {
//   try {
//     if (!process.env.MONGODB_URL) {
//       console.error("MONGODB_URL missing in .env");
//       process.exit(1);
//     }

//     await mongoose.connect(process.env.MONGODB_URL);
//     console.log("Connected to MongoDB");

//     // Check if admin already exists
//     const existingAdmin = await User.findOne({ role: "admin" });

//     if (existingAdmin) {
//       console.log("Admin already exists");
//       process.exit();
//     }

//     const hashedPassword = await bcrypt.hash("Admin@321", 12);

//     const admin = await User.create({
//       firstName: "System",
//       lastName: "Admin",
//       email: "admin@gmail.com",
//       password: hashedPassword,
//       role: "admin"
//     });

//     console.log("Admin created successfully");
//     console.log("Email:", admin.email);

//     process.exit();
//   } catch (error) {
//     console.error("Admin creation failed:", error);
//     process.exit(1);
//   }
// };

// createAdmin();
