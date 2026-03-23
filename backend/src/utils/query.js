import pool from "../config/db.js";

export const query = async (sql, params = [], connection = pool) => {
  const [rows] = await connection.query(sql, params);
  return rows;
};

export const getPagination = (page = 1, limit = 10) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  return {
    page: safePage,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit
  };
};
