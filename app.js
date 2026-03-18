import express from "express";
import cors from "cors";
import userRouter from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";

import orderRoutes from "./routes/orderRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", userRouter);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

export default app;
