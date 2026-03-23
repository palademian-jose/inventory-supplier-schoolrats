import express from "express";
import { body, param } from "express-validator";
import asyncHandler from "../utils/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { query } from "../utils/query.js";
import { getPagination } from "../utils/query.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { offset, limit, page } = getPagination(req.query.page, req.query.limit);
    const search = req.query.search ? `%${req.query.search}%` : null;
    const whereClause = search
      ? `WHERE (
          r.name LIKE ? OR r.phone LIKE ? OR r.email LIKE ? OR r.status LIKE ? OR
          d.name LIKE ? OR r.recipient_type LIKE ?
        )`
      : "";
    const params = search ? [search, search, search, search, search, search] : [];

    const rows = await query(
      `SELECT r.*, d.name AS department_name
       FROM recipients r
       LEFT JOIN departments d ON d.id = r.department_id
       ${whereClause}
       ORDER BY r.created_at DESC, r.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const countRows = await query(
      `SELECT COUNT(*) AS total
       FROM recipients r
       LEFT JOIN departments d ON d.id = r.department_id
       ${whereClause}`,
      params
    );

    res.json({
      data: rows,
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
    body("phone").notEmpty().withMessage("Phone is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("department_id").optional({ values: "falsy" }).isInt().withMessage("Department must be valid"),
    body("recipient_type")
      .optional()
      .isIn(["person", "department", "organization"])
      .withMessage("Recipient type is invalid"),
    body("status").notEmpty().withMessage("Status is required"),
    validate
  ],
  asyncHandler(async (req, res) => {
    const {
      name,
      phone,
      email,
      address,
      status,
      user_id = null,
      department_id = null,
      recipient_type = "person"
    } = req.body;
    const result = await query(
      `INSERT INTO recipients (name, phone, email, address, status, user_id, department_id, recipient_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, phone, email, address || "", status, user_id || null, department_id || null, recipient_type]
    );
    const created = await query(
      `SELECT r.*, d.name AS department_name
       FROM recipients r
       LEFT JOIN departments d ON d.id = r.department_id
       WHERE r.id = ?`,
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
    body("phone").notEmpty().withMessage("Phone is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("department_id").optional({ values: "falsy" }).isInt().withMessage("Department must be valid"),
    body("recipient_type")
      .optional()
      .isIn(["person", "department", "organization"])
      .withMessage("Recipient type is invalid"),
    body("status").notEmpty().withMessage("Status is required"),
    validate
  ],
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      name,
      phone,
      email,
      address,
      status,
      user_id = null,
      department_id = null,
      recipient_type = "person"
    } = req.body;
    await query(
      `UPDATE recipients
       SET name = ?, phone = ?, email = ?, address = ?, status = ?, user_id = ?, department_id = ?,
           recipient_type = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, phone, email, address || "", status, user_id || null, department_id || null, recipient_type, id]
    );
    const updated = await query(
      `SELECT r.*, d.name AS department_name
       FROM recipients r
       LEFT JOIN departments d ON d.id = r.department_id
       WHERE r.id = ?`,
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
    await query("DELETE FROM recipients WHERE id = ?", [req.params.id]);
    res.json({ message: "Recipient deleted successfully" });
  })
);

export default router;
