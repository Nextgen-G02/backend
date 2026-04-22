import express from "express";
import cors from "cors";
import userRouter from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import financialRoutes from "./routes/financialRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", userRouter);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/financial", financialRoutes);
app.use("/api/suppliers", supplierRoutes);


export default app;



