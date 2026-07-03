import express from "express";
import cors from "cors";

// Web Routes
import userRouter from "./routes/web/userRoutes.js";
import newsletterRoutes from "./routes/web/newsletterRoutes.js";

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
import paymentRoutes from "./routes/system/paymentRoutes.js";
import customCakeRoutes from "./routes/customCakeRoutes.js";
import alertRoutes from "./routes/system/alertRoutes.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get("/", (req, res) => {
    res.send("Backend is running");
});

// API Endpoints
app.use("/api/auth", userRouter);
app.use("/api/newsletter", newsletterRoutes);
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
app.use("/api/payment", paymentRoutes);
app.use("/api/custom-cakes", customCakeRoutes);
app.use("/api/alerts", alertRoutes);

// Deep Diagnostic Middleware
app.use((err, req, res, next) => {
    console.error("Critical System Error:", err.stack);
    res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

export default app;