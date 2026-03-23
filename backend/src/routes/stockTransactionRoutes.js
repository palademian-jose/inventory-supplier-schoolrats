import express from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { authenticate } from "../middleware/auth.js";
import { query } from "../utils/query.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const conditions = [];
    const params = [];

    if (req.query.item_id) {
      conditions.push("st.item_id = ?");
      params.push(req.query.item_id);
    }

    if (req.query.type) {
      conditions.push("st.transaction_type = ?");
      params.push(req.query.type);
    }

    if (req.query.start_date) {
      conditions.push("DATE(st.transaction_date) >= ?");
      params.push(req.query.start_date);
    }

    if (req.query.end_date) {
      conditions.push("DATE(st.transaction_date) <= ?");
      params.push(req.query.end_date);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const rows = await query(
      `SELECT st.*, i.name AS item_name, i.category AS item_category, m.name AS member_name
       FROM stock_transactions st
       JOIN items i ON i.id = st.item_id
       LEFT JOIN members m ON m.id = st.member_id
       ${whereClause}
       ORDER BY st.transaction_date DESC, st.id DESC`,
      params
    );
    res.json(rows);
  })
);

export default router;
