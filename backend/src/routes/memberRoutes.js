import express from "express";
import bcrypt from "bcryptjs";
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
          u.full_name LIKE ? OR u.username LIKE ? OR u.phone LIKE ? OR u.email LIKE ? OR
          u.status LIKE ? OR u.role LIKE ? OR d.name LIKE ?
        )`
      : "";
    const params = search ? [search, search, search, search, search, search, search] : [];

    const rows = await query(
      `SELECT u.id, u.username, u.full_name, u.full_name AS name, u.email, u.phone, u.address,
              u.department_id, u.role, u.status, u.created_at, u.updated_at, d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       ${whereClause}
       ORDER BY u.created_at DESC, u.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const countRows = await query(
      `SELECT COUNT(*) AS total
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
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
    body("full_name").notEmpty().withMessage("Name is required"),
    body("username").notEmpty().withMessage("Username is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("phone").notEmpty().withMessage("Phone is required"),
    body("email").optional({ values: "falsy" }).isEmail().withMessage("Valid email is required"),
    body("department_id").optional({ values: "falsy" }).isInt().withMessage("Department must be valid"),
    body("role").optional().isIn(["admin", "staff"]).withMessage("Role is invalid"),
    body("status").notEmpty().withMessage("Status is required"),
    validate
  ],
  asyncHandler(async (req, res) => {
    const {
      full_name,
      username,
      password,
      phone,
      email,
      address,
      status,
      department_id = null,
      role = "staff"
    } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (username, password_hash, full_name, email, phone, address, department_id, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, passwordHash, full_name, email || null, phone, address || "", department_id || null, role, status]
    );
    const created = await query(
      `SELECT u.id, u.username, u.full_name, u.full_name AS name, u.email, u.phone, u.address,
              u.department_id, u.role, u.status, u.created_at, u.updated_at, d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       WHERE u.id = ?`,
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
    body("full_name").notEmpty().withMessage("Name is required"),
    body("username").notEmpty().withMessage("Username is required"),
    body("password").optional({ values: "falsy" }).isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("phone").notEmpty().withMessage("Phone is required"),
    body("email").optional({ values: "falsy" }).isEmail().withMessage("Valid email is required"),
    body("department_id").optional({ values: "falsy" }).isInt().withMessage("Department must be valid"),
    body("role").optional().isIn(["admin", "staff"]).withMessage("Role is invalid"),
    body("status").notEmpty().withMessage("Status is required"),
    validate
  ],
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      full_name,
      username,
      password,
      phone,
      email,
      address,
      status,
      department_id = null,
      role = "staff"
    } = req.body;
    const updateFields = [
      "username = ?",
      "full_name = ?",
      "email = ?",
      "phone = ?",
      "address = ?",
      "department_id = ?",
      "role = ?",
      "status = ?",
      "updated_at = CURRENT_TIMESTAMP"
    ];
    const params = [username, full_name, email || null, phone, address || "", department_id || null, role, status];

    if (password) {
      updateFields.splice(1, 0, "password_hash = ?");
      params.splice(1, 0, await bcrypt.hash(password, 10));
    }

    params.push(id);

    await query(
      `UPDATE users
       SET ${updateFields.join(", ")}
       WHERE id = ?`,
      params
    );
    const updated = await query(
      `SELECT u.id, u.username, u.full_name, u.full_name AS name, u.email, u.phone, u.address,
              u.department_id, u.role, u.status, u.created_at, u.updated_at, d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       WHERE u.id = ?`,
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
      await query("DELETE FROM users WHERE id = ?", [req.params.id]);
    } catch (error) {
      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        throw httpError(409, "User cannot be deleted because it is referenced by related records");
      }
      throw error;
    }
    res.json({ message: "User deleted successfully" });
  })
);

export default router;
