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
              po.expected_delivery_date, po.approved_at, po.received_at,
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
      `SELECT po.*, s.name AS supplier_name, cu.full_name AS created_by_name, au.full_name AS approved_by_name
       FROM purchase_orders po
       JOIN suppliers s ON s.id = po.supplier_id
       LEFT JOIN users cu ON cu.id = po.created_by
       LEFT JOIN users au ON au.id = po.approved_by
       WHERE po.id = ?`,
      [req.params.id]
    );
    const detailRows = await query(
      `SELECT pol.*, i.name AS item_name, i.category AS item_category, u.symbol AS unit_symbol
       FROM purchase_order_lines pol
       JOIN items i ON i.id = pol.item_id
       LEFT JOIN units_of_measure u ON u.id = i.unit_id
       WHERE pol.purchase_order_id = ?`,
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
    body("expected_delivery_date").optional({ values: "falsy" }).isISO8601().withMessage("Expected delivery date must be valid"),
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

      const { supplier_id, status, items, notes = "", expected_delivery_date = null } = req.body;
      const totalAmount = items.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
        0
      );
      const orderNumber = `PO-${Date.now()}`;
      const approvedAt = status === "Approved" || status === "Received" ? new Date() : null;
      const receivedAt = status === "Received" ? new Date() : null;
      const approvedBy = approvedAt ? req.user.id : null;

      const [orderResult] = await connection.execute(
        `INSERT INTO purchase_orders (
           order_number, supplier_id, created_by, approved_by, status, total_amount, notes,
           expected_delivery_date, approved_at, received_at
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderNumber,
          supplier_id,
          req.user.id,
          approvedBy,
          status,
          totalAmount,
          notes,
          expected_delivery_date || null,
          approvedAt,
          receivedAt
        ]
      );

      for (const item of items) {
        const lineTotal = Number(item.quantity) * Number(item.unit_price);
        await connection.execute(
          `INSERT INTO purchase_order_lines (
             purchase_order_id, item_id, quantity, received_quantity, unit_price, line_total
           )
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderResult.insertId,
            item.item_id,
            item.quantity,
            status === "Received" ? item.quantity : 0,
            item.unit_price,
            lineTotal
          ]
        );

        if (status === "Received") {
          await connection.execute(
            "UPDATE items SET stock_quantity = stock_quantity + ? WHERE id = ?",
            [item.quantity, item.item_id]
          );
          const [stockRows] = await connection.execute(
            "SELECT stock_quantity FROM items WHERE id = ?",
            [item.item_id]
          );
          await connection.execute(
            `INSERT INTO stock_transactions (
               item_id, created_by, transaction_type, quantity, balance_after, reference_type, reference_id, notes
             )
             VALUES (?, ?, 'STOCK_RECEIPT', ?, ?, 'purchase_order', ?, ?)`,
            [
              item.item_id,
              req.user.id,
              item.quantity,
              Number(stockRows[0].stock_quantity),
              orderResult.insertId,
              `Received via ${orderNumber}`
            ]
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
          "SELECT item_id, quantity FROM purchase_order_lines WHERE purchase_order_id = ?",
          [id],
          connection
        );
        for (const detail of details) {
          await query(
            "UPDATE items SET stock_quantity = stock_quantity + ? WHERE id = ?",
            [detail.quantity, detail.item_id],
            connection
          );
          const stockRows = await query(
            "SELECT stock_quantity FROM items WHERE id = ?",
            [detail.item_id],
            connection
          );
          await query(
            `INSERT INTO stock_transactions (
               item_id, created_by, transaction_type, quantity, balance_after, reference_type, reference_id, notes
             )
             VALUES (?, ?, 'STOCK_RECEIPT', ?, ?, 'purchase_order', ?, ?)`,
            [
              detail.item_id,
              req.user.id,
              detail.quantity,
              Number(stockRows[0].stock_quantity),
              id,
              `Received via ${order.order_number}`
            ],
            connection
          );
          await query(
            `UPDATE purchase_order_lines
             SET received_quantity = quantity
             WHERE purchase_order_id = ? AND item_id = ?`,
            [id, detail.item_id],
            connection
          );
        }
      }

      const updateFields = ["status = ?", "updated_at = CURRENT_TIMESTAMP"];
      const updateParams = [status];

      if ((order.status === "Pending") && (status === "Approved" || status === "Received")) {
        updateFields.push("approved_by = ?", "approved_at = COALESCE(approved_at, CURRENT_TIMESTAMP)");
        updateParams.push(req.user.id);
      }

      if (status === "Received") {
        updateFields.push("received_at = COALESCE(received_at, CURRENT_TIMESTAMP)");
      }

      updateParams.push(id);

      await query(
        `UPDATE purchase_orders SET ${updateFields.join(", ")} WHERE id = ?`,
        updateParams,
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
