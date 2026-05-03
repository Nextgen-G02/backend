import express from "express";
import cors from "cors";

// Web Routes
import userRouter from "./routes/web/userRoutes.js";

// System Routes
import productRoutes from "./routes/system/productRoutes.js";
import orderRoutes from "./routes/system/orderRoutes.js";
import categoryRoutes from "./routes/system/categoryRoutes.js";
import inventoryRoutes from "./routes/system/inventoryRoutes.js";
import customerRoutes from "./routes/system/customerRoutes.js";
import financialRoutes from "./routes/system/financialRoutes.js";
import supplierRoutes from "./routes/system/supplierRoutes.js";
import purchaseRoutes from "./routes/system/purchaseRoutes.js";
import expenseRoutes from "./routes/system/expenseRoutes.js";
import cashDrawerRoutes from "./routes/system/cashDrawerRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// API Endpoints
app.use("/api/auth", userRouter);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/financial", financialRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/cash-drawer", cashDrawerRoutes);


export default app;