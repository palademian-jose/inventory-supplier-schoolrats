import express from "express";
import { body, param } from "express-validator";
import asyncHandler from "../utils/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { query } from "../utils/query.js";
import { httpError } from "../utils/httpError.js";

const router = express.Router();

router.use(authenticate);

const createMasterResourceRoutes = ({
  path,
  table,
  select,
  createColumns,
  updateAssignments,
  validators
}) => {
  router.get(
    `/${path}`,
    asyncHandler(async (_req, res) => {
      const rows = await query(`${select} ORDER BY name ASC`);
      res.json(rows);
    })
  );

  router.post(
    `/${path}`,
    authorize("admin", "staff"),
    [...validators, validate],
    asyncHandler(async (req, res) => {
      const values = createColumns.map((column) => req.body[column]);
      const placeholders = createColumns.map(() => "?").join(", ");
      const result = await query(
        `INSERT INTO ${table} (${createColumns.join(", ")}) VALUES (${placeholders})`,
        values
      );
      const created = await query(`${select} WHERE id = ?`, [result.insertId]);
      res.status(201).json(created[0]);
    })
  );

  router.put(
    `/${path}/:id`,
    authorize("admin", "staff"),
    [param("id").isInt(), ...validators, validate],
    asyncHandler(async (req, res) => {
      const values = createColumns.map((column) => req.body[column]);
      await query(
        `UPDATE ${table} SET ${updateAssignments.join(", ")} WHERE id = ?`,
        [...values, req.params.id]
      );
      const updated = await query(`${select} WHERE id = ?`, [req.params.id]);
      res.json(updated[0]);
    })
  );

  router.delete(
    `/${path}/:id`,
    authorize("admin"),
    [param("id").isInt(), validate],
    asyncHandler(async (req, res) => {
      try {
        await query(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);
      } catch (error) {
        if (error.code === "ER_ROW_IS_REFERENCED_2") {
          throw httpError(409, "Record cannot be deleted because it is referenced by related records");
        }
        throw error;
      }
      res.json({ message: "Record deleted successfully" });
    })
  );
};

createMasterResourceRoutes({
  path: "departments",
  table: "departments",
  select: "SELECT id, code, name FROM departments",
  createColumns: ["code", "name"],
  updateAssignments: ["code = ?", "name = ?"],
  validators: [
    body("code").notEmpty().withMessage("Code is required"),
    body("name").notEmpty().withMessage("Name is required")
  ]
});

createMasterResourceRoutes({
  path: "categories",
  table: "categories",
  select: "SELECT id, code, name FROM categories",
  createColumns: ["code", "name"],
  updateAssignments: ["code = ?", "name = ?"],
  validators: [
    body("code").notEmpty().withMessage("Code is required"),
    body("name").notEmpty().withMessage("Name is required")
  ]
});

createMasterResourceRoutes({
  path: "units",
  table: "units_of_measure",
  select: "SELECT id, name, symbol FROM units_of_measure",
  createColumns: ["name", "symbol"],
  updateAssignments: ["name = ?", "symbol = ?"],
  validators: [
    body("name").notEmpty().withMessage("Name is required"),
    body("symbol").notEmpty().withMessage("Symbol is required")
  ]
});

export default router;
