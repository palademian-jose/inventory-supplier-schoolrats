import express from "express";
import { body, param } from "express-validator";
import asyncHandler from "../utils/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { query } from "../utils/query.js";
import { getPagination } from "../utils/query.js";
import { httpError } from "../utils/httpError.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { offset, limit, page } = getPagination(req.query.page, req.query.limit);
    const search = req.query.search ? `%${req.query.search}%` : null;
    const whereClause = search
      ? `WHERE (
          i.name LIKE ? OR c.name LIKE ? OR u.name LIKE ? OR u.symbol LIKE ?
        )`
      : "";
    const params = search ? [search, search, search, search] : [];

    const rows = await query(
      `SELECT i.*, c.name AS category_name, u.name AS unit_name, u.symbol AS unit_symbol
       FROM items i
       LEFT JOIN categories c ON c.id = i.category_id
       LEFT JOIN units_of_measure u ON u.id = i.unit_id
       ${whereClause}
       ORDER BY i.created_at DESC, i.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const countRows = await query(
      `SELECT COUNT(*) AS total
       FROM items i
       LEFT JOIN categories c ON c.id = i.category_id
       LEFT JOIN units_of_measure u ON u.id = i.unit_id
       ${whereClause}`,
      params
    );

    const data = rows.map((item) => ({
      ...item,
      is_low_stock: Number(item.stock_quantity) <= Number(item.reorder_level)
    }));

    res.json({
      data,
      pagination: {
        page,
        limit,
        total: countRows[0].total
      }
    });
  })
);

router.post(
  "/",
  authorize("admin", "staff"),
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("category_id").isInt().withMessage("Category is required"),
    body("unit_id").optional({ values: "falsy" }).isInt().withMessage("Unit must be valid"),
    body("price").isFloat({ min: 0 }).withMessage("Price must be zero or greater"),
    body("stock_quantity").isInt({ min: 0 }).withMessage("Stock cannot be negative"),
    body("reorder_level").isInt({ min: 0 }).withMessage("Reorder level cannot be negative"),
    validate
  ],
  asyncHandler(async (req, res) => {
    const { name, category_id, unit_id = null, price, stock_quantity, reorder_level } = req.body;
    const result = await query(
      `INSERT INTO items (name, category_id, unit_id, price, stock_quantity, reorder_level)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, category_id, unit_id || null, price, stock_quantity, reorder_level]
    );
    const created = await query(
      `SELECT i.*, c.name AS category_name, u.name AS unit_name, u.symbol AS unit_symbol
       FROM items i
       LEFT JOIN categories c ON c.id = i.category_id
       LEFT JOIN units_of_measure u ON u.id = i.unit_id
       WHERE i.id = ?`,
      [result.insertId]
    );
    res.status(201).json(created[0]);
  })
);

router.put(
  "/:id",
  authorize("admin", "staff"),
  [
    param("id").isInt(),
    body("name").notEmpty().withMessage("Name is required"),
    body("category_id").isInt().withMessage("Category is required"),
    body("unit_id").optional({ values: "falsy" }).isInt().withMessage("Unit must be valid"),
    body("price").isFloat({ min: 0 }).withMessage("Price must be zero or greater"),
    body("stock_quantity").isInt({ min: 0 }).withMessage("Stock cannot be negative"),
    body("reorder_level").isInt({ min: 0 }).withMessage("Reorder level cannot be negative"),
    validate
  ],
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, category_id, unit_id = null, price, stock_quantity, reorder_level } = req.body;
    await query(
      `UPDATE items
       SET name = ?, category_id = ?, unit_id = ?, price = ?, stock_quantity = ?,
           reorder_level = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, category_id, unit_id || null, price, stock_quantity, reorder_level, id]
    );
    const updated = await query(
      `SELECT i.*, c.name AS category_name, u.name AS unit_name, u.symbol AS unit_symbol
       FROM items i
       LEFT JOIN categories c ON c.id = i.category_id
       LEFT JOIN units_of_measure u ON u.id = i.unit_id
       WHERE i.id = ?`,
      [id]
    );
    res.json(updated[0]);
  })
);

router.delete(
  "/:id",
  authorize("admin"),
  [param("id").isInt(), validate],
  asyncHandler(async (req, res) => {
    try {
      await query("DELETE FROM items WHERE id = ?", [req.params.id]);
    } catch (error) {
      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        throw httpError(409, "Item cannot be deleted because it is referenced by related records");
      }
      throw error;
    }
    res.json({ message: "Item deleted successfully" });
  })
);

export default router;
