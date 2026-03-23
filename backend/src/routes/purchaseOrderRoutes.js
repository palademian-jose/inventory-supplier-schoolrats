import express from "express";
import { body, param } from "express-validator";
import asyncHandler from "../utils/asyncHandler.js";
import pool from "../config/db.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { query } from "../utils/query.js";
import { httpError } from "../utils/httpError.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rows = await query(
      `SELECT po.id, po.order_number, po.status, po.total_amount, po.order_date,
              s.name AS supplier_name
       FROM purchase_orders po
       JOIN suppliers s ON s.id = po.supplier_id
       ORDER BY po.order_date DESC, po.id DESC`
    );
    res.json(rows);
  })
);

router.get(
  "/:id",
  [param("id").isInt(), validate],
  asyncHandler(async (req, res) => {
    const orderRows = await query(
      `SELECT po.*, s.name AS supplier_name
       FROM purchase_orders po
       JOIN suppliers s ON s.id = po.supplier_id
       WHERE po.id = ?`,
      [req.params.id]
    );
    const detailRows = await query(
      `SELECT pod.*, i.name AS item_name
       FROM purchase_order_details pod
       JOIN items i ON i.id = pod.item_id
       WHERE pod.purchase_order_id = ?`,
      [req.params.id]
    );
    res.json({ ...orderRows[0], details: detailRows });
  })
);

router.post(
  "/",
  authorize("admin", "staff"),
  [
    body("supplier_id").isInt().withMessage("Supplier is required"),
    body("status").isIn(["Pending", "Approved", "Received"]).withMessage("Invalid status"),
    body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
    body("items.*.item_id").isInt().withMessage("Item is required"),
    body("items.*.quantity").isInt({ min: 1 }).withMessage("Quantity must be greater than zero"),
    body("items.*.unit_price").isFloat({ min: 0 }).withMessage("Unit price must be zero or greater"),
    validate
  ],
  asyncHandler(async (req, res) => {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const { supplier_id, status, items, notes = "" } = req.body;
      const totalAmount = items.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
        0
      );
      const orderNumber = `PO-${Date.now()}`;

      const [orderResult] = await connection.execute(
        `INSERT INTO purchase_orders (order_number, supplier_id, status, total_amount, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [orderNumber, supplier_id, status, totalAmount, notes]
      );

      for (const item of items) {
        await connection.execute(
          `INSERT INTO purchase_order_details (purchase_order_id, item_id, quantity, unit_price, line_total)
           VALUES (?, ?, ?, ?, ?)`,
          [
            orderResult.insertId,
            item.item_id,
            item.quantity,
            item.unit_price,
            Number(item.quantity) * Number(item.unit_price)
          ]
        );

        if (status === "Received") {
          await connection.execute(
            "UPDATE items SET stock_quantity = stock_quantity + ? WHERE id = ?",
            [item.quantity, item.item_id]
          );
          await connection.execute(
            `INSERT INTO stock_transactions (item_id, transaction_type, quantity, reference_type, reference_id, notes)
             VALUES (?, 'PURCHASE_IN', ?, 'purchase_order', ?, ?)`,
            [item.item_id, item.quantity, orderResult.insertId, `Received via ${orderNumber}`]
          );
        }
      }

      await connection.commit();
      res.status(201).json({
        id: orderResult.insertId,
        order_number: orderNumber,
        total_amount: totalAmount
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

router.patch(
  "/:id/status",
  authorize("admin", "staff"),
  [
    param("id").isInt(),
    body("status").isIn(["Pending", "Approved", "Received"]).withMessage("Invalid status"),
    validate
  ],
  asyncHandler(async (req, res) => {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const id = Number(req.params.id);
      const { status } = req.body;
      const currentRows = await query("SELECT * FROM purchase_orders WHERE id = ?", [id], connection);

      if (!currentRows.length) {
        throw httpError(404, "Purchase order not found");
      }

      const order = currentRows[0];

      if (order.status !== "Received" && status === "Received") {
        const details = await query(
          "SELECT item_id, quantity FROM purchase_order_details WHERE purchase_order_id = ?",
          [id],
          connection
        );
        for (const detail of details) {
          await query(
            "UPDATE items SET stock_quantity = stock_quantity + ? WHERE id = ?",
            [detail.quantity, detail.item_id],
            connection
          );
          await query(
            `INSERT INTO stock_transactions (item_id, transaction_type, quantity, reference_type, reference_id, notes)
             VALUES (?, 'PURCHASE_IN', ?, 'purchase_order', ?, ?)`,
            [detail.item_id, detail.quantity, id, `Received via ${order.order_number}`],
            connection
          );
        }
      }

      await query(
        "UPDATE purchase_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [status, id],
        connection
      );

      await connection.commit();
      res.json({ message: "Purchase order status updated" });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

export default router;
