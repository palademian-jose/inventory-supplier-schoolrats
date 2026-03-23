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
    body("member_id").isInt().withMessage("Member is required"),
    body("item_id").isInt().withMessage("Item is required"),
    body("quantity").isInt({ min: 1 }).withMessage("Quantity must be greater than zero"),
    validate
  ],
  asyncHandler(async (req, res) => {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const { member_id, item_id, quantity, notes = "" } = req.body;
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

      const result = await query(
        `INSERT INTO stock_transactions (item_id, member_id, transaction_type, quantity, reference_type, notes)
         VALUES (?, ?, 'ISSUE_TO_MEMBER', ?, 'member_issue', ?)`,
        [item_id, member_id, quantity, notes],
        connection
      );

      await connection.commit();
      res.status(201).json({ message: "Item issued successfully", transactionId: result.insertId });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

export default router;
