import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body } from "express-validator";
import asyncHandler from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { query } from "../utils/query.js";
import { authenticate } from "../middleware/auth.js";
import { httpError } from "../utils/httpError.js";

const router = express.Router();

router.post(
  "/login",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
    validate
  ],
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const users = await query(
      "SELECT id, username, password_hash, role, full_name FROM users WHERE username = ? LIMIT 1",
      [username]
    );

    if (!users.length) {
      throw httpError(401, "Invalid username or password");
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      throw httpError(401, "Invalid username or password");
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.full_name
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.full_name
      }
    });
  })
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  })
);

export default router;
