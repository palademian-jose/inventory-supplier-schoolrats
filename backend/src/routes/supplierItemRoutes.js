import express from "express";
import { body, param } from "express-validator";
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
      `SELECT si.id, si.supplier_id, si.item_id, si.supplier_sku, si.is_preferred,
              si.supplier_price, si.lead_time_days,
              s.name AS supplier_name, i.name AS item_name
       FROM supplier_catalog_items si
       JOIN suppliers s ON s.id = si.supplier_id
       JOIN items i ON i.id = si.item_id
       ORDER BY si.id DESC`
    );
    res.json(rows);
  })
);

router.post(
  "/",
  authorize("admin", "staff"),
  [
    body("supplier_id").isInt().withMessage("Supplier is required"),
    body("item_id").isInt().withMessage("Item is required"),
    body("supplier_sku").optional({ values: "falsy" }).isString(),
    body("is_preferred").optional().isBoolean().withMessage("Preferred flag must be true or false"),
    body("supplier_price").isFloat({ min: 0 }).withMessage("Supplier price must be zero or greater"),
    body("lead_time_days").isInt({ min: 0 }).withMessage("Lead time must be zero or greater"),
    validate
  ],
  asyncHandler(async (req, res) => {
    const {
      supplier_id,
      item_id,
      supplier_sku = null,
      is_preferred = false,
      supplier_price,
      lead_time_days
    } = req.body;
    const result = await query(
      `INSERT INTO supplier_catalog_items (
         supplier_id, item_id, supplier_sku, is_preferred, supplier_price, lead_time_days
       )
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         supplier_sku = VALUES(supplier_sku),
         is_preferred = VALUES(is_preferred),
         supplier_price = VALUES(supplier_price),
         lead_time_days = VALUES(lead_time_days)`,
      [supplier_id, item_id, supplier_sku || null, is_preferred, supplier_price, lead_time_days]
    );
    res.status(201).json({ message: "Supplier catalog entry saved", id: result.insertId || null });
  })
);

router.delete(
  "/:id",
  authorize("admin"),
  [param("id").isInt(), validate],
  asyncHandler(async (req, res) => {
    await query("DELETE FROM supplier_catalog_items WHERE id = ?", [req.params.id]);
    res.json({ message: "Supplier catalog entry deleted successfully" });
  })
);

export default router;
