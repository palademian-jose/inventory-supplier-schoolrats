import express from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { authenticate } from "../middleware/auth.js";
import { query } from "../utils/query.js";

const router = express.Router();

router.get(
  "/summary",
  authenticate,
  asyncHandler(async (_req, res) => {
    const [totalItems] = await query("SELECT COUNT(*) AS count FROM items");
    const [lowStockItems] = await query(
      "SELECT COUNT(*) AS count FROM items WHERE stock_quantity <= reorder_level"
    );
    const [totalSuppliers] = await query("SELECT COUNT(*) AS count FROM suppliers");
    const [pendingOrders] = await query(
      "SELECT COUNT(*) AS count FROM purchase_orders WHERE status = 'Pending'"
    );
    const recentTransactions = await query(
      `SELECT st.id, st.transaction_type, st.quantity, st.transaction_date, st.reference_type,
              st.reference_id, st.notes, st.recipient_id, st.balance_after, i.name AS item_name,
              i.category AS item_category, r.name AS recipient_name, u.full_name AS created_by_name
       FROM stock_transactions st
       JOIN items i ON i.id = st.item_id
       LEFT JOIN recipients r ON r.id = st.recipient_id
       LEFT JOIN users u ON u.id = st.created_by
       ORDER BY st.transaction_date DESC
       LIMIT 10`
    );

    res.json({
      cards: {
        totalItems: totalItems.count,
        lowStockItems: lowStockItems.count,
        totalSuppliers: totalSuppliers.count,
        pendingPurchaseOrders: pendingOrders.count
      },
      recentTransactions
    });
  })
);

export default router;
