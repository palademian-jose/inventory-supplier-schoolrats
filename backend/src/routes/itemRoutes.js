import express from "express";
import { body, param } from "express-validator";
import asyncHandler from "../utils/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { query } from "../utils/query.js";
import { listResource } from "../services/resourceService.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const result = await listResource({
      table: "items",
      searchColumns: ["name", "category"],
      orderBy: "created_at DESC",
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search
    });
    result.data = result.data.map((item) => ({
      ...item,
      is_low_stock: Number(item.stock_quantity) <= Number(item.reorder_level)
    }));
    res.json(result);
  })
);

router.post(
  "/",
  authorize("admin", "staff"),
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("category").notEmpty().withMessage("Category is required"),
    body("price").isFloat({ min: 0 }).withMessage("Price must be zero or greater"),
    body("stock_quantity").isInt({ min: 0 }).withMessage("Stock cannot be negative"),
    body("reorder_level").isInt({ min: 0 }).withMessage("Reorder level cannot be negative"),
    validate
  ],
  asyncHandler(async (req, res) => {
    const { name, category, price, stock_quantity, reorder_level } = req.body;
    const result = await query(
      `INSERT INTO items (name, category, price, stock_quantity, reorder_level)
       VALUES (?, ?, ?, ?, ?)`,
      [name, category, price, stock_quantity, reorder_level]
    );
    const created = await query("SELECT * FROM items WHERE id = ?", [result.insertId]);
    res.status(201).json(created[0]);
  })
);

router.put(
  "/:id",
  authorize("admin", "staff"),
  [
    param("id").isInt(),
    body("name").notEmpty().withMessage("Name is required"),
    body("category").notEmpty().withMessage("Category is required"),
    body("price").isFloat({ min: 0 }).withMessage("Price must be zero or greater"),
    body("stock_quantity").isInt({ min: 0 }).withMessage("Stock cannot be negative"),
    body("reorder_level").isInt({ min: 0 }).withMessage("Reorder level cannot be negative"),
    validate
  ],
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, category, price, stock_quantity, reorder_level } = req.body;
    await query(
      `UPDATE items
       SET name = ?, category = ?, price = ?, stock_quantity = ?, reorder_level = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, category, price, stock_quantity, reorder_level, id]
    );
    const updated = await query("SELECT * FROM items WHERE id = ?", [id]);
    res.json(updated[0]);
  })
);

router.delete(
  "/:id",
  authorize("admin"),
  [param("id").isInt(), validate],
  asyncHandler(async (req, res) => {
    await query("DELETE FROM items WHERE id = ?", [req.params.id]);
    res.json({ message: "Item deleted successfully" });
  })
);

export default router;
