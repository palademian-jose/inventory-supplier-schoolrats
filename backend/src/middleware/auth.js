import jwt from "jsonwebtoken";
import { httpError } from "../utils/httpError.js";

export const authenticate = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(httpError(401, "Authentication required"));
  }

  const token = authHeader.split(" ")[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(httpError(401, "Invalid or expired token"));
  }
};

export const authorize = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(httpError(403, "Access denied"));
  }

  next();
};
