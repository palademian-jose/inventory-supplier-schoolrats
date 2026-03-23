import { validationResult } from "express-validator";
import { httpError } from "../utils/httpError.js";

export const validate = (req, _res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const message = result
    .array()
    .map((item) => item.msg)
    .join(", ");

  next(httpError(400, message));
};
