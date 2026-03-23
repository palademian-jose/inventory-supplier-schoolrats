import { query, getPagination } from "../utils/query.js";

export const listResource = async ({
  table,
  select = "*",
  searchColumns = [],
  orderBy = "id DESC",
  page,
  limit,
  search = ""
}) => {
  const { offset, limit: safeLimit, page: safePage } = getPagination(page, limit);
  const searchValue = `%${search}%`;
  const filters = [];
  const params = [];

  if (search && searchColumns.length) {
    filters.push(`(${searchColumns.map((column) => `${column} LIKE ?`).join(" OR ")})`);
    searchColumns.forEach(() => params.push(searchValue));
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const rows = await query(
    `SELECT ${select} FROM ${table} ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...params, safeLimit, offset]
  );
  const countRows = await query(
    `SELECT COUNT(*) AS total FROM ${table} ${whereClause}`,
    params
  );

  return {
    data: rows,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: countRows[0].total
    }
  };
};
