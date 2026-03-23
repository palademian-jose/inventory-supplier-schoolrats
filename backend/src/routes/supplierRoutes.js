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
      table: "suppliers",
      searchColumns: ["name", "contact_person", "phone", "email"],
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search
    });

    res.json(result);
  })
);

router.get(
  "/:id/items",
  [param("id").isInt(), validate],
  asyncHandler(async (req, res) => {
    const rows = await query(
      `SELECT si.id, si.supplier_price, si.lead_time_days, si.supplier_sku, si.is_preferred,
              i.id AS item_id, i.name AS item_name
       FROM supplier_catalog_items si
       JOIN items i ON i.id = si.item_id
       WHERE si.supplier_id = ?`,
      [req.params.id]
    );
    res.json(rows);
  })
);

router.post(
  "/",
  authorize("admin", "staff"),
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("phone").notEmpty().withMessage("Phone is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    validate
  ],
  asyncHandler(async (req, res) => {
    const { name, contact_person, phone, email, address } = req.body;
    const result = await query(
      `INSERT INTO suppliers (name, contact_person, phone, email, address)
       VALUES (?, ?, ?, ?, ?)`,
      [name, contact_person || "", phone, email, address || ""]
    );
    const created = await query("SELECT * FROM suppliers WHERE id = ?", [result.insertId]);
    res.status(201).json(created[0]);
  })
);

router.put(
  "/:id",
  authorize("admin", "staff"),
  [
    param("id").isInt(),
    body("name").notEmpty().withMessage("Name is required"),
    body("phone").notEmpty().withMessage("Phone is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    validate
  ],
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, contact_person, phone, email, address } = req.body;
    await query(
      `UPDATE suppliers
       SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, contact_person || "", phone, email, address || "", id]
    );
    const updated = await query("SELECT * FROM suppliers WHERE id = ?", [id]);
    res.json(updated[0]);
  })
);

router.delete(
  "/:id",
  authorize("admin"),
  [param("id").isInt(), validate],
  asyncHandler(async (req, res) => {
    await query("DELETE FROM suppliers WHERE id = ?", [req.params.id]);
    res.json({ message: "Supplier deleted successfully" });
  })
);

export default router;
