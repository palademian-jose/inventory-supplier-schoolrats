import express from "express";
import { body } from "express-validator";
import asyncHandler from "../utils/asyncHandler.js";
import pool from "../config/db.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { query } from "../utils/query.js";
import { httpError } from "../utils/httpError.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  authorize("admin", "staff"),
  [
    body("user_id").isInt().withMessage("User is required"),
    body("item_id").isInt().withMessage("Item is required"),
    body("quantity").isInt({ min: 1 }).withMessage("Quantity must be greater than zero"),
    validate
  ],
  asyncHandler(async (req, res) => {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const { user_id, item_id, quantity, notes = "" } = req.body;
      const itemRows = await query("SELECT * FROM items WHERE id = ? FOR UPDATE", [item_id], connection);

      if (!itemRows.length) {
        throw httpError(404, "Item not found");
      }

      const item = itemRows[0];

      if (Number(item.stock_quantity) < Number(quantity)) {
        throw httpError(400, "Insufficient stock");
      }

      await query(
        "UPDATE items SET stock_quantity = stock_quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [quantity, item_id],
        connection
      );

      const nextBalance = Number(item.stock_quantity) - Number(quantity);

      const result = await query(
        `INSERT INTO stock_transactions (
           item_id, unit_id, user_id, created_by, transaction_type, quantity, balance_after,
           reference_type, notes
         )
         VALUES (?, ?, ?, ?, 'STOCK_ISSUE', ?, ?, 'stock_issue', ?)`,
        [item_id, item.unit_id, user_id, req.user.id, quantity, nextBalance, notes],
        connection
      );

      await connection.commit();
      res.status(201).json({ message: "Stock issued successfully", transactionId: result.insertId });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

export default router;
