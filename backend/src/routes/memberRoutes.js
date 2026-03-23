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
      table: "members",
      searchColumns: ["name", "phone", "email", "status"],
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search
    });

    res.json(result);
  })
);

router.post(
  "/",
  authorize("admin", "staff"),
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("phone").notEmpty().withMessage("Phone is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("status").notEmpty().withMessage("Status is required"),
    validate
  ],
  asyncHandler(async (req, res) => {
    const { name, phone, email, address, status, user_id = null } = req.body;
    const result = await query(
      `INSERT INTO members (name, phone, email, address, status, user_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, phone, email, address || "", status, user_id]
    );
    const created = await query("SELECT * FROM members WHERE id = ?", [result.insertId]);
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
    body("status").notEmpty().withMessage("Status is required"),
    validate
  ],
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, phone, email, address, status, user_id = null } = req.body;
    await query(
      `UPDATE members
       SET name = ?, phone = ?, email = ?, address = ?, status = ?, user_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, phone, email, address || "", status, user_id, id]
    );
    const updated = await query("SELECT * FROM members WHERE id = ?", [id]);
    res.json(updated[0]);
  })
);

router.delete(
  "/:id",
  authorize("admin"),
  [param("id").isInt(), validate],
  asyncHandler(async (req, res) => {
    await query("DELETE FROM members WHERE id = ?", [req.params.id]);
    res.json({ message: "Member deleted successfully" });
  })
);

export default router;
