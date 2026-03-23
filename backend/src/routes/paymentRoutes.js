import express from "express";
import { body } from "express-validator";
import asyncHandler from "../utils/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { query } from "../utils/query.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rows = await query(
      `SELECT p.*, po.order_number, po.total_amount,
              CASE
                WHEN IFNULL(summary.paid_amount, 0) >= po.total_amount THEN 'Paid'
                WHEN IFNULL(summary.paid_amount, 0) > 0 THEN 'Partial'
                ELSE 'Pending'
              END AS payment_status
       FROM purchase_orders po
       LEFT JOIN payments p ON p.purchase_order_id = po.id
       LEFT JOIN (
         SELECT purchase_order_id, SUM(amount) AS paid_amount
         FROM payments
         GROUP BY purchase_order_id
       ) summary ON summary.purchase_order_id = po.id
       ORDER BY po.id DESC, p.payment_date DESC`
    );
    res.json(rows);
  })
);

router.post(
  "/",
  authorize("admin", "staff"),
  [
    body("purchase_order_id").isInt().withMessage("Purchase order is required"),
    body("amount").isFloat({ min: 0.01 }).withMessage("Amount must be greater than zero"),
    validate
  ],
  asyncHandler(async (req, res) => {
    const { purchase_order_id, amount, payment_method = "Cash", notes = "" } = req.body;
    const result = await query(
      `INSERT INTO payments (purchase_order_id, amount, payment_method, notes)
       VALUES (?, ?, ?, ?)`,
      [purchase_order_id, amount, payment_method, notes]
    );
    const created = await query("SELECT * FROM payments WHERE id = ?", [result.insertId]);
    res.status(201).json(created[0]);
  })
);

export default router;
