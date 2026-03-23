import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import memberRoutes from "./routes/memberRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import supplierItemRoutes from "./routes/supplierItemRoutes.js";
import purchaseOrderRoutes from "./routes/purchaseOrderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import stockTransactionRoutes from "./routes/stockTransactionRoutes.js";
import issueRoutes from "./routes/issueRoutes.js";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ message: "Inventory Supplier Management API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/supplier-items", supplierItemRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/stock-transactions", stockTransactionRoutes);
app.use("/api/issues", issueRoutes);

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Internal server error"
  });
});

export default app;
